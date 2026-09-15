import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CoinOverlay, DeckStack, GameBoard, InputChoice, MapPreview, PlayerHand, TargetChoice } from './components.jsx'
import { chooseTarget, createGame, finishGame, nextInputPlayer, playMove, recordFromGame, resolveGame, setPlayerInputs } from './game.js'
import { MAPS, MAP_BY_ID } from './maps.js'
import { setSoundEnabled, sound } from './audio.js'
import { createGuestPeer, createHostPeer, inviteUrl, makeRoomCode, snapshotForPlayer } from './online.js'
import './online.css'
import './online-polish.css'

const STORAGE_KEY = 'logic-gate-duel-playtests-v2'
const ROOM_PARAM = new URLSearchParams(window.location.search).get('room')?.toUpperCase() || ''

function OpponentPrivate({ playerId, isCurrent }) {
  return <section className={`opponent-private ${isCurrent ? 'is-current' : ''}`}>
    <span className={`player-pip player-${playerId + 1}`}/>
    <div><strong>PLAYER {playerId + 1}</strong><small>상대 손패 비공개</small></div>
    {isCurrent && <em>TURN</em>}
  </section>
}

function OnlineLanding({ onHost, onJoin, roomCode, setRoomCode }) {
  const [level, setLevel] = useState(1)
  const [selectedMap, setSelectedMap] = useState(MAPS.find((map) => map.level === 1)?.id)
  const maps = MAPS.filter((map) => map.level === level)
  useEffect(() => { if (!MAP_BY_ID[selectedMap] || MAP_BY_ID[selectedMap].level !== level) setSelectedMap(maps[0]?.id) }, [level])
  return <main className="online-landing">
    <header className="online-hero"><div><span>ONLINE 2P PLAYTEST</span><h1>PC · 태블릿 · 폰에서<br/><em>각자 자기 패로.</em></h1><p>한 명이 방을 만들고 6자리 코드를 공유하면 서로 다른 기기에서 바로 플레이할 수 있습니다.</p></div><a href="/" className="online-back-link">← SOLO / PASS & PLAY</a></header>
    <section className="online-connect-grid">
      <div className="online-panel host-panel"><span className="eyebrow">HOST A GAME</span><h2>내가 방 만들기</h2><div className="online-level-tabs">{[1,2].map((item)=><button key={item} className={level===item?'active':''} onClick={()=>setLevel(item)}>LEVEL {item}</button>)}</div><div className="online-map-list">{maps.map((map)=><button key={map.id} className={selectedMap===map.id?'active':''} onClick={()=>setSelectedMap(map.id)}><div><MapPreview map={map}/></div><span><b>{map.code}</b>{map.name}</span></button>)}</div><button className="online-primary" onClick={()=>onHost(selectedMap)}>방 만들기</button></div>
      <div className="online-panel join-panel"><span className="eyebrow">JOIN A GAME</span><h2>친구 방 들어가기</h2><p>초대 링크를 열면 자동 접속됩니다. 코드만 받았다면 아래 6자리를 입력하세요.</p><label>ROOM CODE<input value={roomCode} onChange={(event)=>setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6} autoCapitalize="characters" inputMode="text"/></label><button className="online-primary secondary" disabled={roomCode.length < 6} onClick={()=>onJoin(roomCode)}>코드로 입장하기</button><div className="online-note"><strong>기기 제한 없음</strong><span>브라우저만 열리면 PC, 노트북, 태블릿, 스마트폰에서 같은 방식으로 참여할 수 있습니다.</span></div></div>
    </section>
  </main>
}

function Lobby({ role, roomCode, connected, mapId, error, onStart, onShare, onLeave }) {
  const map = MAP_BY_ID[mapId]
  return <main className="online-lobby"><div className="lobby-card"><div className="lobby-status"><span className={connected?'dot live':'dot'}/>{connected?'PLAYER 2 CONNECTED':'WAITING FOR PLAYER 2'}</div><span className="eyebrow">ONLINE ROOM CODE</span><h1>{roomCode}</h1>{map&&<div className="lobby-map"><div><MapPreview map={map}/></div><span>{map.code} · {map.name}</span></div>}{role==='host'?<><p>친구에게 아래 버튼으로 공유하세요. 방 코드와 바로 입장할 수 있는 링크가 함께 전달됩니다.</p><button className="copy-invite share-invite" onClick={onShare}>친구에게 공유하기</button><button className="online-primary" disabled={!connected} onClick={onStart}>{connected?'게임 시작':'친구 접속 대기 중'}</button></>:<><p>{connected?'연결 완료. 호스트가 게임을 시작하기를 기다리는 중입니다.':'방 코드로 호스트에 연결하는 중입니다.'}</p><div className="lobby-loader"><i/><i/><i/></div></>}{error&&<div className="online-error">{error}</div>}<button className="text-exit" onClick={onLeave}>나가기</button></div></main>
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
  const roomRef = useRef(ROOM_PARAM)
  const mapRef = useRef(MAPS[0].id)

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
    cleanup()
    const code=makeRoomCode(); roomRef.current=code; mapRef.current=selectedMapId
    setRole('host'); setPlayerId(0); setRoomCode(code); setMapId(selectedMapId); setScreen('lobby'); setConnected(false); setError('')
    const session=createHostPeer(code,{
      onReady:()=>{},
      onConnected:()=>{ setConnected(true); session.send({type:'lobby',mapId:selectedMapId,roomCode:code}) },
      onDisconnected:()=>setConnected(false),
      onError:(err)=>setError(err?.type==='unavailable-id'?'방 코드가 겹쳤습니다. 나갔다가 다시 만들어 주세요.':`연결 오류: ${err?.type||err?.message||'unknown'}`),
      onData:(data)=>handleHostData(data),
    })
    sessionRef.current=session
  }

  function joinRoom(codeValue){
    const code=String(codeValue).trim().toUpperCase(); if(code.length<6)return
    cleanup(); roomRef.current=code
    setRole('guest'); setPlayerId(1); setRoomCode(code); setScreen('lobby'); setConnected(false); setError('')
    const session=createGuestPeer(code,{
      onConnected:()=>{ setConnected(true); session.send({type:'hello'}) },
      onDisconnected:()=>setConnected(false),
      onError:(err)=>setError(`연결 오류: ${err?.type||err?.message||'방을 찾을 수 없습니다.'}`),
      onData:(data)=>handleGuestData(data),
    })
    sessionRef.current=session
  }

  function hostCommit(next,meta={}){
    fullGameRef.current=next; setGame(next); sessionRef.current?.send({type:'state',game:snapshotForPlayer(next,1),meta})
    if(meta.deal)setDealPulse(); if(meta.sound)sound(meta.sound)
  }

  function startMatch(seed){
    if(role!=='host')return
    const next=createGame(mapRef.current,'online',seed??undefined); fullGameRef.current=next; showStart(next)
    sessionRef.current?.send({type:'start',game:snapshotForPlayer(next,1)})
  }

  function handleHostData(data){
    if(!data||typeof data!=='object')return
    if(data.type==='hello'){ sessionRef.current?.send({type:'lobby',mapId:mapRef.current,roomCode:roomRef.current}); return }
    if(data.type!=='command')return
    const current=fullGameRef.current; if(!current)return
    if(data.command==='target'){
      const next=chooseTarget(current,1,Number(data.value)); if(next!==current)hostCommit(next,{sound:'flip'})
    } else if(data.command==='inputs'){
      const next=setPlayerInputs(current,1,data.values||{}); if(next!==current)hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'})
    } else if(data.command==='move'){
      const next=playMove(current,data.slotId,data.action); if(next!==current)hostCommit(next,{sound:'place'})
    } else if(data.command==='resolve') {
      beginResolutionHost()
    } else if(data.command==='replay') {
      startMatch()
    }
  }

  function handleGuestData(data){
    if(!data||typeof data!=='object')return
    if(data.type==='lobby'){ mapRef.current=data.mapId; roomRef.current=data.roomCode||roomRef.current; setMapId(data.mapId); setRoomCode(roomRef.current); return }
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
    if(role==='host'){
      const current=fullGameRef.current; const next=setPlayerInputs(current,0,inputDraft)
      if(next!==current){ setInputDraft({}); hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'}) }
    } else {
      sessionRef.current?.send({type:'command',command:'inputs',values:inputDraft}); setInputDraft({}); sound('flip')
    }
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

  async function shareInvite(){
    const code=roomRef.current || roomCode
    const url=inviteUrl(code)
    const fullText=`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}\n바로 입장: ${url}\n링크를 열거나 ONLINE 2P에서 방 코드를 입력하면 돼.`
    try { await navigator.clipboard.writeText(fullText) } catch {}
    setCopied(true); later(()=>setCopied(false),1800)
    if(navigator.share){
      try { await navigator.share({ title:'LOGIC GATE DUEL', text:`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}`, url }) }
      catch(error){ if(error?.name!=='AbortError') console.warn(error) }
    }
  }
  function leave(){ cleanup(); const url=new URL(window.location.href); url.search=''; window.location.href=url.toString() }

  if(screen==='landing')return <OnlineLanding onHost={createRoom} onJoin={joinRoom} roomCode={roomCode} setRoomCode={setRoomCode}/>
  if(screen==='lobby')return <Lobby role={role} roomCode={roomCode} connected={connected} mapId={mapId} error={error} onStart={()=>startMatch()} onShare={shareInvite} onLeave={leave}/>
  if(!game||playerId===null)return null

  const me=game.players[playerId]
  const myTurn=game.phase==='play'&&game.currentPlayer===playerId&&!dealing&&!resolving
  const phaseText=game.phase==='target_choice'?'TARGET 선택':game.phase==='input_selection'?'비밀 INPUT 설정':game.phase==='play'?`TURN ${game.turnNumber+1}`:game.phase==='reveal'?(resolving?'신호 계산 중':'회로 완성'):'RESULT'
  return <LayoutGroup><main className="game-page online-game-page">
    <header className="online-game-bar"><button onClick={leave}>← 나가기</button><div><span>ONLINE ROOM {roomCode}</span><strong>YOU ARE PLAYER {playerId+1}</strong></div><div className={`connection-chip ${connected?'live':''}`}>{connected?'CONNECTED':'DISCONNECTED'}</div></header>
    <section className="status-row"><div className={`target-badge player-1 ${game.currentPlayer===0?'current':''}`}><span>P1 TARGET</span><strong>{game.players[0].target??'?'}</strong></div><div className="phase-status"><span>{phaseText}</span><strong>{game.phase==='play'?`PLAYER ${game.currentPlayer+1} 차례`:map.description}</strong></div><div className={`target-badge player-2 ${game.currentPlayer===1?'current':''}`}><span>P2 TARGET</span><strong>{game.players[1].target??'?'}</strong></div></section>

    {game.phase==='target_choice'&&!coinVisible&&(game.targetChooser===playerId?<TargetChoice playerId={playerId} onChoose={handleTarget}/>:<WaitingPanel>상대가 TARGET을 고르는 중...</WaitingPanel>)}
    {game.phase==='input_selection'&&(inputPlayer===playerId?<InputChoice game={game} playerId={playerId} draft={inputDraft} onChange={(id,value)=>setInputDraft((draft)=>({...draft,[id]:value}))} onSubmit={submitInputs}/>:<WaitingPanel>상대가 비밀 INPUT을 설정하는 중...</WaitingPanel>)}

    {(game.phase==='play'||game.phase==='reveal'||game.phase==='finished')&&<div className="table-layout online-table-layout">
      <div className="opponent-area"><OpponentPrivate playerId={opponentId} isCurrent={game.phase==='play'&&game.currentPlayer===opponentId}/></div>
      <div className="board-zone"><div className="deck-floating"><DeckStack count={game.deck?.length??0} dealing={dealing}/></div><GameBoard map={map} game={game} viewerId={playerId} selectedAction={selectedAction} onSlotClick={placeAction} revealAllInputs={game.phase==='reveal'||game.phase==='finished'||resolving} solution={solution||game.result} revealIndex={game.phase==='finished'?999:revealIndex} resolving={resolving}/>{game.phase==='reveal'&&!resolving&&<motion.button className="run-circuit-button" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} onClick={requestResolution}><span>▶</span> 회로 실행</motion.button>}</div>
      <div className="current-area"><PlayerHand player={me} playerId={playerId} isCurrent={myTurn} selectedAction={selectedAction} wildSide={wildSide} onSelectAction={selectAction} onFlipWild={()=>{setWildSide((side)=>side==='NOT'?'EMPTY':'NOT');sound('flip')}} onDragAction={handleDrag} dealing={dealing}/>{selectedAction&&myTurn&&<div className="placement-hint">카드를 빈 슬롯으로 끌거나 슬롯을 클릭하세요. <button onClick={()=>setSelectedAction(null)}>취소</button></div>}</div>
    </div>}

    <AnimatePresence>{coinVisible&&<CoinOverlay winnerId={game.coinWinner} onDone={()=>setCoinVisible(false)}/>} {dealing&&<motion.div className="deal-banner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>SHUFFLE / DEAL</span><strong>{MAP_BY_ID[game.mapId].level===1?'4':'5'} CARDS EACH</strong></motion.div>} {game.phase==='finished'&&<OnlineResult game={game} playerId={playerId} role={role} onReplay={requestReplay} onMenu={leave}/>}</AnimatePresence>
    {!connected&&<div className="disconnect-banner">상대 연결이 끊겼습니다. 잠시 기다리거나 방을 다시 만들어 주세요.</div>}
    {copied&&<div className="copy-toast">초대 문구 · 방 코드 · 링크 복사됨</div>}
  </main></LayoutGroup>
}
