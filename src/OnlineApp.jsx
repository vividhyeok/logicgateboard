import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CardBack, CoinOverlay, DeckStack, GameBoard, InputChoice, MapPreview, PlayerHand, TargetChoice } from './components.jsx'
import { chooseTarget, createGame, finishGame, getActionForCard, getWildAction, nextInputPlayer, playMove, recordFromGame, resolveGame, setPlayerInputs } from './game.js'
import { MAPS, MAP_BY_ID } from './maps.js'
import { setSoundEnabled, sound } from './audio.js'
import { createGuestPeer, createHostPeer, inviteUrl, makeRoomCode, snapshotForPlayer } from './online.js'
import './online.css'

const STORAGE_KEY = 'logic-gate-duel-playtests-v2'
const ROOM_PARAM = new URLSearchParams(window.location.search).get('room')?.toUpperCase() || ''

function HiddenHand({ count = 0, playerId, isCurrent, wildUsed }) {
  return <section className={`player-hand opponent-hand hidden-online-hand ${isCurrent ? 'is-current' : ''}`}>
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`}/><strong>PLAYER {playerId + 1}</strong><small>{isCurrent ? 'TURN' : `${count} CARDS`}</small></div>
    <div className="hidden-card-row">
      {Array.from({ length: count }, (_, index) => <motion.div key={index} initial={{ y: -22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * .035 }}><CardBack small/></motion.div>)}
      {!wildUsed && <div className="hidden-wild-token">WILD</div>}
    </div>
  </section>
}

function OnlineLanding({ onHost, onJoin, roomCode, setRoomCode }) {
  const [level, setLevel] = useState(1)
  const [selectedMap, setSelectedMap] = useState(MAPS.find((map) => map.level === 1)?.id)
  const maps = MAPS.filter((map) => map.level === level)
  useEffect(() => { if (!MAP_BY_ID[selectedMap] || MAP_BY_ID[selectedMap].level !== level) setSelectedMap(maps[0]?.id) }, [level])
  return <main className="online-landing">
    <header className="online-hero"><div><span>FAST P2P PLAYTEST</span><h1>둘이 각자 PC에서<br/><em>손패는 비공개로.</em></h1><p>서버 세팅 없이 방 링크 하나로 연결하는 빠른 프로토타입입니다.</p></div><a href="/" className="online-back-link">← SOLO / PASS & PLAY</a></header>
    <section className="online-connect-grid">
      <div className="online-panel host-panel"><span className="eyebrow">HOST A GAME</span><h2>내가 방 만들기</h2><div className="online-level-tabs">{[1,2].map((item)=><button key={item} className={level===item?'active':''} onClick={()=>setLevel(item)}>LEVEL {item}</button>)}</div><div className="online-map-list">{maps.map((map)=><button key={map.id} className={selectedMap===map.id?'active':''} onClick={()=>setSelectedMap(map.id)}><div><MapPreview map={map}/></div><span><b>{map.code}</b>{map.name}</span></button>)}</div><button className="online-primary" onClick={()=>onHost(selectedMap)}>방 만들기</button></div>
      <div className="online-panel join-panel"><span className="eyebrow">JOIN A GAME</span><h2>친구 방 들어가기</h2><p>친구가 보낸 링크를 열면 자동 접속됩니다. 코드만 받았다면 아래에 입력하세요.</p><label>ROOM CODE<input value={roomCode} onChange={(event)=>setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6}/></label><button className="online-primary secondary" disabled={roomCode.length < 6} onClick={()=>onJoin(roomCode)}>입장하기</button><div className="online-note"><strong>프로토타입 방식</strong><span>Peer-to-Peer(WebRTC)라 별도 DB나 로그인 없이 동작합니다.</span></div></div>
    </section>
  </main>
}

function Lobby({ role, roomCode, connected, mapId, error, onStart, onCopy, onLeave }) {
  const map = MAP_BY_ID[mapId]
  return <main className="online-lobby"><div className="lobby-card"><div className="lobby-status"><span className={connected?'dot live':'dot'}/>{connected?'PLAYER 2 CONNECTED':'WAITING FOR PLAYER 2'}</div><span className="eyebrow">ONLINE TABLE</span><h1>{roomCode}</h1>{map&&<div className="lobby-map"><div><MapPreview map={map}/></div><span>{map.code} · {map.name}</span></div>}{role==='host'?<><p>이 링크를 친구에게 보내세요. 친구가 접속하면 바로 시작할 수 있습니다.</p><button className="copy-invite" onClick={onCopy}>초대 링크 복사</button><button className="online-primary" disabled={!connected} onClick={onStart}>{connected?'게임 시작':'친구 접속 대기 중'}</button></>:<><p>{connected?'호스트가 게임을 시작하기를 기다리는 중입니다.':'호스트 방에 연결하는 중입니다.'}</p><div className="lobby-loader"><i/><i/><i/></div></>}{error&&<div className="online-error">{error}</div>}<button className="text-exit" onClick={onLeave}>나가기</button></div></main>
}

function WaitingPanel({ children }) { return <motion.div className="phase-panel online-waiting" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><span className="eyebrow">OPPONENT ACTION</span><h2>{children}</h2><div className="loader-line"/></motion.div> }

function OnlineResult({ game, playerId, role, onReplay, onMenu }) {
  const won = game.result?.winner === playerId
  return <motion.div className="online-result-overlay" initial={{opacity:0}} animate={{opacity:1}}><motion.div className={`online-result-card ${won?'won':'lost'}`} initial={{scale:.88,y:28}} animate={{scale:1,y:0}} transition={{type:'spring',stiffness:260,damping:24}}><span>{won?'YOU WIN':'YOU LOSE'}</span><strong>OUTPUT {game.result?.output}</strong><p>PLAYER {game.result?.winner + 1} 승리 · TARGET {game.players[game.result?.winner]?.target}</p><div><button className="online-primary" onClick={onReplay}>{role==='host'?'새 시드로 재대결':'재대결 요청'}</button><button className="online-secondary-button" onClick={onMenu}>나가기</button></div></motion.div></motion.div>
}

export default function OnlineApp() {
  const [role,setRole] = useState(null)
  const [playerId,setPlayerId] = useState(null)
  const [screen,setScreen] = useState('landing')
  const [roomCode,setRoomCode] = useState(ROOM_PARAM)
  const [mapId,setMapId] = useState(MAPS[0].id)
  const [connected,setConnected] = useState(false)
  const [error,setError] = useState('')
  const [game,setGame] = useState(null)
  const [selectedAction,setSelectedAction] = useState(null)
  const [wildSide,setWildSide] = useState('NOT')
  const [inputDraft,setInputDraft] = useState({})
  const [coinVisible,setCoinVisible] = useState(false)
  const [dealing,setDealing] = useState(false)
  const [solution,setSolution] = useState(null)
  const [revealIndex,setRevealIndex] = useState(-1)
  const [resolving,setResolving] = useState(false)
  const [copied,setCopied] = useState(false)
  const sessionRef = useRef(null)
  const fullGameRef = useRef(null)
  const timersRef = useRef([])
  const resolvingRef = useRef(false)

  const map = game ? MAP_BY_ID[game.mapId] : MAP_BY_ID[mapId]
  const opponentId = playerId === null ? 1 : 1 - playerId
  const inputPlayer = game?.phase === 'input_selection' ? nextInputPlayer(game) : null

  useEffect(()=>{ setSoundEnabled(true) },[])
  useEffect(()=>()=>cleanup(),[])
  useEffect(()=>{ if (ROOM_PARAM && !role) joinRoom(ROOM_PARAM) },[])

  function later(fn,ms){ const id=window.setTimeout(fn,ms); timersRef.current.push(id); return id }
  function clearTimers(){ timersRef.current.forEach(clearTimeout); timersRef.current=[] }
  function cleanup(){ clearTimers(); try{sessionRef.current?.destroy()}catch{} sessionRef.current=null }

  function setDealPulse(){ setDealing(true); later(()=>setDealing(false),1100) }
  function showStart(snapshot){ setGame(snapshot); setScreen('game'); setSelectedAction(null); setInputDraft({}); setWildSide('NOT'); setSolution(null); setRevealIndex(-1); setResolving(false); setCoinVisible(true); sound('turn') }

  function createRoom(selectedMapId){
    cleanup(); const code=makeRoomCode(); setRole('host'); setPlayerId(0); setRoomCode(code); setMapId(selectedMapId); setScreen('lobby'); setConnected(false); setError('')
    const session=createHostPeer(code,{
      onReady:()=>{},
      onConnected:()=>{ setConnected(true); session.send({type:'lobby',mapId:selectedMapId,roomCode:code}) },
      onDisconnected:()=>setConnected(false),
      onError:(err)=>setError(err?.type==='unavailable-id'?'방 코드가 겹쳤습니다. 나갔다가 다시 만들어 주세요.':`연결 오류: ${err?.type||err?.message||'unknown'}`),
      onData:(data)=>handleHostData(data),
    }); sessionRef.current=session
  }

  function joinRoom(codeValue){
    const code=String(codeValue).trim().toUpperCase(); if(code.length<6)return
    cleanup(); setRole('guest'); setPlayerId(1); setRoomCode(code); setScreen('lobby'); setConnected(false); setError('')
    const session=createGuestPeer(code,{
      onConnected:()=>{ setConnected(true); session.send({type:'hello'}) },
      onDisconnected:()=>setConnected(false),
      onError:(err)=>setError(`연결 오류: ${err?.type||err?.message||'방을 찾을 수 없습니다.'}`),
      onData:(data)=>handleGuestData(data),
    }); sessionRef.current=session
  }

  function hostCommit(next,meta={}){
    fullGameRef.current=next; setGame(next); sessionRef.current?.send({type:'state',game:snapshotForPlayer(next,1),meta})
    if(meta.deal)setDealPulse(); if(meta.sound)sound(meta.sound)
  }

  function startMatch(seed){
    if(role!=='host')return
    const next=createGame(mapId,'online',seed??undefined); fullGameRef.current=next; showStart(next)
    sessionRef.current?.send({type:'start',game:snapshotForPlayer(next,1)})
  }

  function handleHostData(data){
    if(!data||typeof data!=='object')return
    if(data.type==='hello'){ sessionRef.current?.send({type:'lobby',mapId,roomCode}); return }
    if(data.type!=='command')return
    const current=fullGameRef.current; if(!current)return
    if(data.command==='target'){
      const next=chooseTarget(current,1,Number(data.value)); if(next!==current)hostCommit(next,{sound:'flip'})
    } else if(data.command==='inputs'){
      const next=setPlayerInputs(current,1,data.values||{}); if(next!==current)hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'})
    } else if(data.command==='move'){
      const next=playMove(current,data.slotId,data.action); if(next!==current)hostCommit(next,{sound:'place'})
    } else if(data.command==='resolve'){
      beginResolutionHost()
    } else if(data.command==='replay'){
      startMatch()
    }
  }

  function handleGuestData(data){
    if(!data||typeof data!=='object')return
    if(data.type==='lobby'){ setMapId(data.mapId); setRoomCode(data.roomCode||roomCode); return }
    if(data.type==='start'){ showStart(data.game); return }
    if(data.type==='state'){
      setGame(data.game); setSelectedAction(null); if(data.meta?.deal)setDealPulse(); if(data.meta?.sound)sound(data.meta.sound)
      if(data.game?.phase==='finished'){ setResolving(false); setSolution(data.game.result); setRevealIndex(999) }
      return
    }
    if(data.type==='resolve')beginResolutionLocal(data.result)
  }

  function handleTarget(value){
    if(!game||game.targetChooser!==playerId)return
    if(role==='host'){ const next=chooseTarget(fullGameRef.current,0,value); if(next!==fullGameRef.current)hostCommit(next,{sound:'flip'}) }
    else sessionRef.current?.send({type:'command',command:'target',value})
  }

  function submitInputs(){
    if(!game||inputPlayer!==playerId)return
    if(role==='host'){ const current=fullGameRef.current; const next=setPlayerInputs(current,0,inputDraft); if(next!==current){ setInputDraft({}); hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'}) } }
    else { sessionRef.current?.send({type:'command',command:'inputs',values:inputDraft}); setInputDraft({}); sound('flip') }
  }

  function selectAction(action){ if(!game||game.phase!=='play'||game.currentPlayer!==playerId||dealing||resolving)return; setSelectedAction((current)=>current?.cardId===action.cardId&&current?.kind===action.kind?null:action) }
  function placeAction(slotId,action=selectedAction){
    if(!action||!game||game.phase!=='play'||game.currentPlayer!==playerId)return
    setSelectedAction(null)
    if(role==='host'){ const current=fullGameRef.current; const next=playMove(current,slotId,action); if(next!==current)hostCommit(next,{sound:'place'}) }
    else sessionRef.current?.send({type:'command',command:'move',slotId,action})
  }
  function handleDrag(action,event){ const x=event?.clientX??event?.nativeEvent?.clientX; const y=event?.clientY??event?.nativeEvent?.clientY; if(x===undefined||y===undefined)return; const slot=document.elementsFromPoint(x,y).find((element)=>element?.dataset?.slotId); if(slot?.dataset?.slotId)placeAction(slot.dataset.slotId,action) }

  function beginResolutionHost(){
    if(role!=='host'||resolvingRef.current)return
    const current=fullGameRef.current; if(!current||current.phase!=='reveal')return
    const result=resolveGame(current); sessionRef.current?.send({type:'resolve',result}); beginResolutionLocal(result)
    const duration=900+result.revealOrder.length*520
    later(()=>{ const finished=finishGame(fullGameRef.current,result); hostCommit(finished); const record=recordFromGame(finished); try{ const records=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); localStorage.setItem(STORAGE_KEY,JSON.stringify([...records,record])) }catch{}; resolvingRef.current=false; sound('win') },duration)
  }
  function beginResolutionLocal(result){
    if(resolvingRef.current)return
    resolvingRef.current=true; setSolution(result); setResolving(true); setRevealIndex(-1); sound('flip')
    result.revealOrder.forEach((nodeId,index)=>later(()=>{ setRevealIndex(index); sound('signal',{value:result.signals[nodeId]}) },420+index*520))
    later(()=>{ setResolving(false); resolvingRef.current=false },760+result.revealOrder.length*520)
  }
  function requestResolution(){ if(role==='host')beginResolutionHost(); else sessionRef.current?.send({type:'command',command:'resolve'}) }
  function requestReplay(){ if(role==='host')startMatch(); else sessionRef.current?.send({type:'command',command:'replay'}) }

  async function copyInvite(){ try{await navigator.clipboard.writeText(inviteUrl(roomCode));setCopied(true);later(()=>setCopied(false),1400)}catch{} }
  function leave(){ cleanup(); const url=new URL(window.location.href); url.search=''; window.location.href=url.toString() }

  if(screen==='landing')return <OnlineLanding onHost={createRoom} onJoin={joinRoom} roomCode={roomCode} setRoomCode={setRoomCode}/>
  if(screen==='lobby')return <Lobby role={role} roomCode={roomCode} connected={connected} mapId={mapId} error={error} onStart={()=>startMatch()} onCopy={copyInvite} onLeave={leave}/>
  if(!game||playerId===null)return null

  const me=game.players[playerId]; const opponent=game.players[opponentId]; const myTurn=game.phase==='play'&&game.currentPlayer===playerId&&!dealing&&!resolving
  const phaseText=game.phase==='target_choice'?'TARGET 선택':game.phase==='input_selection'?'비밀 INPUT 설정':game.phase==='play'?`TURN ${game.turnNumber+1}`:game.phase==='reveal'?(resolving?'신호 계산 중':'회로 완성'):'RESULT'
  return <LayoutGroup><main className="game-page online-game-page">
    <header className="online-game-bar"><button onClick={leave}>← 나가기</button><div><span>ONLINE ROOM {roomCode}</span><strong>YOU ARE PLAYER {playerId+1}</strong></div><div className={`connection-chip ${connected?'live':''}`}>{connected?'CONNECTED':'DISCONNECTED'}</div></header>
    <section className="status-row"><div className={`target-badge player-1 ${game.currentPlayer===0?'current':''}`}><span>P1 TARGET</span><strong>{game.players[0].target??'?'}</strong></div><div className="phase-status"><span>{phaseText}</span><strong>{game.phase==='play'?`PLAYER ${game.currentPlayer+1} 차례`:map.description}</strong></div><div className={`target-badge player-2 ${game.currentPlayer===1?'current':''}`}><span>P2 TARGET</span><strong>{game.players[1].target??'?'}</strong></div></section>

    {game.phase==='target_choice'&&!coinVisible&&(game.targetChooser===playerId?<TargetChoice playerId={playerId} onChoose={handleTarget}/>:<WaitingPanel>상대가 TARGET을 고르는 중...</WaitingPanel>)}
    {game.phase==='input_selection'&&(inputPlayer===playerId?<InputChoice game={game} playerId={playerId} draft={inputDraft} onChange={(id,value)=>setInputDraft((draft)=>({...draft,[id]:value}))} onSubmit={submitInputs}/>:<WaitingPanel>상대가 비밀 INPUT을 설정하는 중...</WaitingPanel>)}

    {(game.phase==='play'||game.phase==='reveal'||game.phase==='finished')&&<div className="table-layout online-table-layout">
      <div className="opponent-area"><HiddenHand count={opponent.handCount??opponent.hand.length} playerId={opponentId} isCurrent={game.phase==='play'&&game.currentPlayer===opponentId} wildUsed={opponent.wildUsed}/></div>
      <div className="board-zone"><div className="deck-floating"><DeckStack count={game.deck?.length??0} dealing={dealing}/></div><GameBoard map={map} game={game} viewerId={playerId} selectedAction={selectedAction} onSlotClick={placeAction} revealAllInputs={game.phase==='reveal'||game.phase==='finished'||resolving} solution={solution||game.result} revealIndex={game.phase==='finished'?999:revealIndex} resolving={resolving}/>{game.phase==='reveal'&&!resolving&&<motion.button className="run-circuit-button" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} onClick={requestResolution}><span>▶</span> 회로 실행</motion.button>}</div>
      <div className="current-area"><PlayerHand player={me} playerId={playerId} isCurrent={myTurn} selectedAction={selectedAction} wildSide={wildSide} onSelectAction={selectAction} onFlipWild={()=>{setWildSide((side)=>side==='NOT'?'EMPTY':'NOT');sound('flip')}} onDragAction={handleDrag} dealing={dealing}/>{selectedAction&&myTurn&&<div className="placement-hint">카드를 빈 슬롯으로 끌거나 슬롯을 클릭하세요. <button onClick={()=>setSelectedAction(null)}>취소</button></div>}</div>
    </div>}

    <AnimatePresence>{coinVisible&&<CoinOverlay winnerId={game.coinWinner} onDone={()=>setCoinVisible(false)}/>} {dealing&&<motion.div className="deal-banner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>SHUFFLE / DEAL</span><strong>{MAP_BY_ID[game.mapId].level===1?'4':'5'} CARDS EACH</strong></motion.div>} {game.phase==='finished'&&<OnlineResult game={game} playerId={playerId} role={role} onReplay={requestReplay} onMenu={leave}/>}</AnimatePresence>
    {!connected&&<div className="disconnect-banner">상대 연결이 끊겼습니다. 새로고침하지 말고 잠시 기다리거나 방을 다시 만드세요.</div>}
    {copied&&<div className="copy-toast">초대 링크 복사됨</div>}
  </main></LayoutGroup>
}
