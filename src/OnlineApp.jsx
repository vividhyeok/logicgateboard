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
const PARAMS = new URLSearchParams(window.location.search)
const ROOM_PARAM = PARAMS.get('room')?.toUpperCase() || ''
const HOST_PARAM = PARAMS.get('host')?.toUpperCase() || ''
const HOST_RECOVERY_PREFIX = 'logic-gate-duel-host-room:'

function readRecords() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function hostRecoveryKey(code) { return `${HOST_RECOVERY_PREFIX}${String(code).toUpperCase()}` }
function readHostRecovery(code) { try { return JSON.parse(localStorage.getItem(hostRecoveryKey(code)) || 'null') } catch { return null } }
function normalizeRemoteGame(game) {
  if (!game) return game
  return {
    ...game,
    placements: game.placements || {},
    moves: game.moves || [],
    deck: game.deck || [],
    players: (game.players || []).map((player) => ({
      ...player,
      assignedInputs: player.assignedInputs || [],
      inputValues: player.inputValues || {},
      hand: player.hand || [],
      initialHand: player.initialHand || [],
    })),
  }
}

function OpponentPrivate({ playerId, isCurrent, roleLabel }) {
  return <section className={`opponent-private ${isCurrent ? 'is-current' : ''}`}>
    <span className={`player-pip player-${playerId + 1}`}/>
    <div><strong>상대 · PLAYER {playerId + 1} · {roleLabel}</strong><small>상대 손패 비공개</small></div>
    {isCurrent && <em>TURN</em>}
  </section>
}

function IdentityStrip({ playerId, role, roomCode }) {
  const opponentId = 1 - playerId
  return <div className="online-identity-strip">
    <span><small>YOU</small><b>PLAYER {playerId + 1}</b><em>{role.toUpperCase()}</em></span>
    <span><small>OPPONENT</small><b>PLAYER {opponentId + 1}</b><em>{role === 'host' ? 'GUEST' : 'HOST'}</em></span>
    <span className="identity-room"><small>ROOM</small><b>{roomCode}</b></span>
  </div>
}

function OnlineLanding({ onHost, onJoin, roomCode, setRoomCode }) {
  const [level, setLevel] = useState(1)
  const [selectedMap, setSelectedMap] = useState(MAPS.find((map) => map.level === 1)?.id)
  const maps = MAPS.filter((map) => map.level === level)
  useEffect(() => { if (!MAP_BY_ID[selectedMap] || MAP_BY_ID[selectedMap].level !== level) setSelectedMap(maps[0]?.id) }, [level])
  return <main className="online-landing">
    <header className="online-hero"><div><span>ONLINE 2 PLAYER</span><h1>PC · 태블릿 · 폰에서<br/><em>각자 자기 패로.</em></h1><p>한 명이 방을 만들고 코드를 공유하면 서로 다른 기기에서 바로 플레이할 수 있습니다.</p></div><div className="online-hero-tools"><a href="/" className="online-back-link">← 다른 게임 모드</a></div></header>
    <section className="online-connect-grid">
      <div className="online-panel host-panel"><span className="eyebrow">HOST A GAME · PLAYER 1</span><h2>내가 방 만들기</h2><div className="online-level-tabs">{[1,2].map((item)=><button key={item} className={level===item?'active':''} onClick={()=>setLevel(item)}>LEVEL {item}</button>)}</div><div className="online-map-list">{maps.map((map)=><button key={map.id} className={selectedMap===map.id?'active':''} onClick={()=>setSelectedMap(map.id)}><div><MapPreview map={map}/></div><span><b>{map.code}</b>{map.name}</span></button>)}</div><button className="online-primary" onClick={()=>onHost(selectedMap)}>PLAYER 1로 방 만들기</button></div>
      <div className="online-panel join-panel"><span className="eyebrow">JOIN A GAME · PLAYER 2</span><h2>친구 방 들어가기</h2><p>초대 링크를 열면 자동 접속됩니다. 코드만 받았다면 아래 6자리를 입력하세요.</p><label>ROOM CODE<input value={roomCode} onChange={(event)=>setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6} autoCapitalize="characters" inputMode="text"/></label><button className="online-primary secondary" disabled={roomCode.length < 6} onClick={()=>onJoin(roomCode)}>PLAYER 2로 입장하기</button><div className="online-note"><strong>재연결 지원</strong><span>잠깐 네트워크가 끊겨도 방과 마지막 게임 상태를 유지하고 같은 링크에서 재접속합니다.</span></div></div>
    </section>
  </main>
}

function Lobby({ role, playerId, roomCode, connected, connectionState, disconnectCount, mapId, error, onStart, onShare, onLeave }) {
  const map = MAP_BY_ID[mapId]
  const opponentId = 1 - playerId
  const stateText = connected ? `PLAYER ${opponentId + 1} CONNECTED` : connectionState === 'reconnecting' ? `PLAYER ${opponentId + 1} 재연결 대기 중` : `WAITING FOR PLAYER ${opponentId + 1}`
  return <main className="online-lobby"><div className="lobby-card"><div className="lobby-status"><span className={connected?'dot live':'dot'}/>{stateText}</div><IdentityStrip playerId={playerId} role={role} roomCode={roomCode}/><span className="eyebrow">ONLINE ROOM CODE</span><h1>{roomCode}</h1>{map&&<div className="lobby-map"><div><MapPreview map={map}/></div><span>{map.code} · {map.name}</span></div>}{disconnectCount>0&&<div className="reconnect-note">연결 복구 중 · 게임은 그대로 유지됩니다.</div>}{role==='host'?<><p>함께 플레이할 사람에게 링크를 보내세요.</p><button className="copy-invite share-invite" onClick={onShare}>초대 링크 공유</button><button className="online-primary" disabled={!connected} onClick={onStart}>{connected?'게임 시작':'상대 접속 대기 중'}</button></>:<><p>{connected?'입장 완료. 방장이 게임을 시작할 때까지 기다려 주세요.':'방에 연결하는 중입니다.'}</p><div className="lobby-loader"><i/><i/><i/></div></>}{error&&<div className="online-error">{error}</div>}<div className="lobby-actions"><button className="text-exit" onClick={onLeave}>나가기</button></div></div></main>
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
  const [roomCode,setRoomCode] = useState(ROOM_PARAM || HOST_PARAM)
  const [mapId,setMapId] = useState(MAPS[0].id)
  const [connected,setConnected] = useState(false)
  const [connectionState,setConnectionState] = useState('idle')
  const [disconnectCount,setDisconnectCount] = useState(0)
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
  const [syncingAction,setSyncingAction] = useState(false)
  const [records,setRecords] = useState(()=>readRecords())
  const sessionRef = useRef(null)
  const fullGameRef = useRef(null)
  const timersRef = useRef([])
  const resolvingRef = useRef(false)
  const roomRef = useRef(ROOM_PARAM || HOST_PARAM)
  const mapRef = useRef(MAPS[0].id)
  const hasConnectedRef = useRef(false)
  const connectionEventsRef = useRef([])
  const loggedSeedsRef = useRef(new Set())
  const handledCommandIdsRef = useRef(new Set())

  const map = game ? MAP_BY_ID[game.mapId] : MAP_BY_ID[mapId]
  const opponentId = playerId === null ? 1 : 1 - playerId
  const inputPlayer = game?.phase === 'input_selection' ? nextInputPlayer(game) : null
  const onlineRecords = records.filter((record)=>record.mode==='online'||record.online)

  useEffect(()=>{ setSoundEnabled(true) },[])
  useEffect(()=>()=>cleanup(),[])
  useEffect(()=>{
    if(HOST_PARAM) resumeHostRoom(HOST_PARAM)
    else if(ROOM_PARAM) joinRoom(ROOM_PARAM)
  },[])

  function later(fn,ms){ const id=window.setTimeout(fn,ms); timersRef.current.push(id); return id }
  function clearTimers(){ timersRef.current.forEach(clearTimeout); timersRef.current=[] }
  function cleanup(){ clearTimers(); try{sessionRef.current?.destroy()}catch{} sessionRef.current=null }
  function noteConnection(type,extra={}){ connectionEventsRef.current.push({type,at:new Date().toISOString(),...extra}) }
  function resetConnectionTracking(){ hasConnectedRef.current=false; connectionEventsRef.current=[]; setDisconnectCount(0); setConnectionState('connecting') }
  function markConnected(){
    const wasConnectedBefore=hasConnectedRef.current
    hasConnectedRef.current=true; setConnected(true); setConnectionState('connected'); setError('')
    noteConnection(wasConnectedBefore?'reconnected':'connected')
  }
  function markDisconnected(){
    setConnected(false)
    if(hasConnectedRef.current){ setConnectionState('reconnecting'); setDisconnectCount((count)=>{ const next=count+1; noteConnection('disconnected',{count:next}); return next }) }
    else setConnectionState('connecting')
  }
  function markError(err){ setConnectionState('error'); setError(`연결 오류: ${err?.code||err?.type||err?.message||'unknown'}`); noteConnection('error',{message:err?.message||String(err)}) }

  function setHostUrl(code){ const url=new URL(window.location.href); url.search=''; url.searchParams.set('online','1'); url.searchParams.set('host',code); window.history.replaceState({},'',url) }
  function saveHostRecovery(nextGame=fullGameRef.current){
    const code=roomRef.current; if(!code)return
    try{ localStorage.setItem(hostRecoveryKey(code),JSON.stringify({roomCode:code,mapId:mapRef.current,game:nextGame||null,savedAt:new Date().toISOString()})) }catch{}
  }
  function clearHostRecovery(code=roomRef.current){ try{ localStorage.removeItem(hostRecoveryKey(code)) }catch{} }

  function setDealPulse(){ setDealing(true); later(()=>setDealing(false),1100) }
  function showStart(snapshot){ const normalized=normalizeRemoteGame(snapshot); setGame(normalized); setScreen('game'); setSelectedAction(null); setInputDraft({}); setWildSide('NOT'); setSolution(null); setRevealIndex(-1); setResolving(false); setSyncingAction(false); setCoinVisible(true); sound('turn') }

  function createHostSession(code,selectedMapId,{resumeGame=null}={}){
    const session=createHostPeer(code,{
      onReady:()=>session.setMeta?.({mapId:selectedMapId}),
      onConnected:()=>{
        markConnected()
        const current=fullGameRef.current
        if(current) session.send({type:'state',game:snapshotForPlayer(current,1),meta:{reconnected:true}})
        else session.send({type:'lobby',mapId:selectedMapId,roomCode:code})
      },
      onDisconnected:markDisconnected,
      onError:markError,
      onData:(data,messageId)=>handleHostData(data,messageId),
    })
    sessionRef.current=session
    if(resumeGame){ fullGameRef.current=resumeGame; setGame(resumeGame); setScreen('game'); setCoinVisible(false); setSolution(resumeGame.result||null); setRevealIndex(resumeGame.phase==='finished'?999:-1) }
    return session
  }

  function createRoom(selectedMapId){
    cleanup(); resetConnectionTracking()
    const code=makeRoomCode(); roomRef.current=code; mapRef.current=selectedMapId
    setRole('host'); setPlayerId(0); setRoomCode(code); setMapId(selectedMapId); setScreen('lobby'); setConnected(false); setError('')
    setHostUrl(code); saveHostRecovery(null)
    createHostSession(code,selectedMapId)
  }

  function resumeHostRoom(codeValue){
    const code=String(codeValue).trim().toUpperCase(); const recovery=readHostRecovery(code)
    if(!recovery){ const url=new URL(window.location.href); url.search='?online=1'; window.history.replaceState({},'',url); setRoomCode(''); setError('이 기기에서 복구할 호스트 세션을 찾지 못했습니다. 새 방을 만들어 주세요.'); return }
    cleanup(); resetConnectionTracking(); roomRef.current=code; mapRef.current=recovery.mapId||MAPS[0].id
    setRole('host'); setPlayerId(0); setRoomCode(code); setMapId(mapRef.current); setConnected(false); setError('')
    setScreen(recovery.game?'game':'lobby')
    createHostSession(code,mapRef.current,{resumeGame:recovery.game||null})
  }

  function joinRoom(codeValue){
    const code=String(codeValue).trim().toUpperCase(); if(code.length<6)return
    cleanup(); resetConnectionTracking(); roomRef.current=code
    setRole('guest'); setPlayerId(1); setRoomCode(code); setScreen('lobby'); setConnected(false); setError('')
    const session=createGuestPeer(code,{
      onConnected:()=>{ markConnected(); session.send({type:'hello'}) },
      onTransportReady:()=>session.send({type:'hello'}),
      onDisconnected:markDisconnected,
      onError:markError,
      onMeta:(meta)=>{ if(meta?.mapId){ mapRef.current=meta.mapId; setMapId(meta.mapId) } },
      onRoomClosed:()=>{ setConnected(false); setConnectionState('closed'); setError('PLAYER 1이 방을 종료했습니다.') },
      onDeliveryTimeout:()=>{ setSyncingAction(false); setError('명령 전달이 지연되고 있습니다. 연결이 복구되면 다시 시도해 주세요.') },
      onData:(data)=>handleGuestData(data),
    })
    sessionRef.current=session
  }

  function hostCommit(next,meta={}){
    const previousRevision=Number(fullGameRef.current?.revision||0)
    const committed={...next,revision:previousRevision+1,updatedAt:Date.now()}
    fullGameRef.current=committed; setGame(committed); saveHostRecovery(committed); sessionRef.current?.send({type:'state',game:snapshotForPlayer(committed,1),meta})
    if(meta.deal)setDealPulse(); if(meta.sound)sound(meta.sound)
    return committed
  }

  function startMatch(seed){
    if(role!=='host'||!connected)return
    const next={...createGame(mapRef.current,'online',seed??undefined),revision:0,updatedAt:Date.now()}; fullGameRef.current=next; saveHostRecovery(next); showStart(next)
    sessionRef.current?.setMeta?.({mapId:mapRef.current,status:'playing'})
    sessionRef.current?.send({type:'start',game:snapshotForPlayer(next,1)})
  }

  function handleHostData(data,messageId){
    if(!data||typeof data!=='object')return
    if(messageId&&handledCommandIdsRef.current.has(messageId))return
    if(messageId){
      handledCommandIdsRef.current.add(messageId)
      if(handledCommandIdsRef.current.size>200)handledCommandIdsRef.current.delete(handledCommandIdsRef.current.values().next().value)
    }
    if(data.type==='hello'){
      const current=fullGameRef.current
      if(current) sessionRef.current?.send({type:'state',game:snapshotForPlayer(current,1),meta:{reconnected:true}})
      else sessionRef.current?.send({type:'lobby',mapId:mapRef.current,roomCode:roomRef.current})
      return
    }
    if(data.type!=='command')return
    const current=fullGameRef.current; if(!current)return
    if(Number(data.expectedRevision)!==Number(current.revision||0)){
      sessionRef.current?.send({type:'state',game:snapshotForPlayer(current,1),meta:{resynced:true}})
      return
    }
    if(data.command==='target'){
      const next=chooseTarget(current,1,Number(data.value)); if(next!==current)hostCommit(next,{sound:'flip'})
    } else if(data.command==='inputs'){
      const next=setPlayerInputs(current,1,data.values||{}); if(next!==current)hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'})
    } else if(data.command==='move'){
      const next=playMove(current,data.slotId,data.action); if(next!==current)hostCommit(next,{sound:'place'})
    } else if(data.command==='resolve') beginResolutionHost()
    else if(data.command==='replay') startMatch()
  }

  function handleGuestData(data){
    if(!data||typeof data!=='object')return
    if(data.type==='lobby'){ mapRef.current=data.mapId; roomRef.current=data.roomCode||roomRef.current; setMapId(data.mapId); setRoomCode(roomRef.current); setScreen('lobby'); return }
    if(data.type==='start'){ showStart(data.game); return }
    if(data.type==='state'){
      const normalized=normalizeRemoteGame(data.game); setGame(normalized); setScreen('game'); setSelectedAction(null); setSyncingAction(false); setError(''); if(data.meta?.deal)setDealPulse(); if(data.meta?.sound)sound(data.meta.sound)
      if(normalized?.phase==='finished'){ setResolving(false); setSolution(normalized.result); setRevealIndex(999) }
      return
    }
    if(data.type==='resolve')beginResolutionLocal(data.result)
  }

  function sendGuestCommand(command,values={}){
    if(connectionState==='closed'||syncingAction)return false
    setSyncingAction(true)
    sessionRef.current?.send({type:'command',command,expectedRevision:Number(game?.revision||0),...values})
    return true
  }

  function handleTarget(value){
    if(connectionState==='closed'||!game||game.targetChooser!==playerId)return
    if(role==='host'){ const next=chooseTarget(fullGameRef.current,0,value); if(next!==fullGameRef.current)hostCommit(next,{sound:'flip'}) }
    else sendGuestCommand('target',{value})
  }

  function submitInputs(){
    if(!connected||!game||inputPlayer!==playerId)return
    if(role==='host'){
      const current=fullGameRef.current; const next=setPlayerInputs(current,0,inputDraft)
      if(next!==current){ setInputDraft({}); hostCommit(next,{deal:current.phase!=='play'&&next.phase==='play',sound:'flip'}) }
    } else {
      if(sendGuestCommand('inputs',{values:inputDraft})){ setInputDraft({}); sound('flip') }
    }
  }

  function selectAction(action){ if(connectionState==='closed'||!game||game.phase!=='play'||game.currentPlayer!==playerId||dealing||resolving)return; setSelectedAction((current)=>current?.cardId===action.cardId&&current?.kind===action.kind?null:action) }
  function placeAction(slotId,action=selectedAction){
    if(connectionState==='closed'||!action||!game||game.phase!=='play'||game.currentPlayer!==playerId)return
    setSelectedAction(null)
    if(role==='host'){ const current=fullGameRef.current; const next=playMove(current,slotId,action); if(next!==current)hostCommit(next,{sound:'place'}) }
    else sendGuestCommand('move',{slotId,action})
  }
  function handleDrag(action,event){ const x=event?.clientX??event?.nativeEvent?.clientX; const y=event?.clientY??event?.nativeEvent?.clientY; if(x===undefined||y===undefined)return; const slot=document.elementsFromPoint(x,y).find((element)=>element?.dataset?.slotId); if(slot?.dataset?.slotId)placeAction(slot.dataset.slotId,action) }

  function appendRecord(record){
    setRecords((current)=>{ const next=[...current,record]; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{} return next })
  }
  function makeOnlineRecord(source,status){
    return {...recordFromGame(source),online:{status,roomCode:roomRef.current,hostPlayer:1,guestPlayer:2,disconnectCount,connectionEvents:[...connectionEventsRef.current]}}
  }
  function logFinishedGame(finished){
    if(role!=='host'||loggedSeedsRef.current.has(finished.seed))return
    loggedSeedsRef.current.add(finished.seed); appendRecord(makeOnlineRecord(finished,'finished'))
  }
  function logAbandonedGame(){
    const current=fullGameRef.current
    if(role!=='host'||!current||current.phase==='finished'||loggedSeedsRef.current.has(current.seed))return
    loggedSeedsRef.current.add(current.seed); appendRecord(makeOnlineRecord(current,'abandoned'))
  }
  function exportOnlineRecords(){
    if(!onlineRecords.length)return
    const blob=new Blob([JSON.stringify(onlineRecords,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const anchor=document.createElement('a')
    anchor.href=url; anchor.download=`logic-gate-duel-online-logs-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url)
  }

  function beginResolutionHost(){
    if(role!=='host'||connectionState==='closed'||resolvingRef.current)return
    const current=fullGameRef.current; if(!current||current.phase!=='reveal')return
    const result=resolveGame(current); sessionRef.current?.send({type:'resolve',result}); beginResolutionLocal(result)
    const duration=900+result.revealOrder.length*520
    later(()=>{ const finished=finishGame(fullGameRef.current,result); hostCommit(finished); logFinishedGame(finished); resolvingRef.current=false; sound('win') },duration)
  }
  function beginResolutionLocal(result){
    if(resolvingRef.current)return
    resolvingRef.current=true; setSolution(result); setResolving(true); setRevealIndex(-1); sound('flip')
    result.revealOrder.forEach((nodeId,index)=>later(()=>{ setRevealIndex(index); sound('signal',{value:result.signals[nodeId]}) },420+index*520))
    later(()=>{ setResolving(false); resolvingRef.current=false },760+result.revealOrder.length*520)
  }
  function requestResolution(){ if(connectionState==='closed')return; if(role==='host')beginResolutionHost(); else sendGuestCommand('resolve') }
  function requestReplay(){ if(connectionState==='closed')return; if(role==='host')startMatch(); else sendGuestCommand('replay') }

  async function shareInvite(){
    const code=roomRef.current || roomCode
    const url=inviteUrl(code)
    const fullText=`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}\n너는 PLAYER 2로 입장해.\n바로 입장: ${url}`
    try { await navigator.clipboard.writeText(fullText) } catch {}
    setCopied(true); later(()=>setCopied(false),1800)
    if(navigator.share){
      try { await navigator.share({ title:'LOGIC GATE DUEL', text:`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}\n너는 PLAYER 2로 입장해.`, url }) }
      catch(error){ if(error?.name!=='AbortError') console.warn(error) }
    }
  }
  async function leave(){
    logAbandonedGame(); clearTimers()
    try{ if(role==='host')await sessionRef.current?.closeRoom?.(); else await sessionRef.current?.destroy?.() }catch{}
    if(role==='host')clearHostRecovery(); sessionRef.current=null
    const url=new URL(window.location.href); url.search=''; window.location.href=url.toString()
  }

  if(screen==='landing')return <OnlineLanding onHost={createRoom} onJoin={joinRoom} roomCode={roomCode} setRoomCode={setRoomCode}/>
  if(screen==='lobby'&&role&&playerId!==null)return <Lobby role={role} playerId={playerId} roomCode={roomCode} connected={connected} connectionState={connectionState} disconnectCount={disconnectCount} mapId={mapId} error={error} onStart={()=>startMatch()} onShare={shareInvite} onLeave={leave}/>
  if(!game||playerId===null||!role)return null

  const me=game.players[playerId]
  const myTurn=connectionState!=='closed'&&!syncingAction&&game.phase==='play'&&game.currentPlayer===playerId&&!dealing&&!resolving
  const phaseText=game.phase==='target_choice'?'TARGET 선택':game.phase==='input_selection'?'비밀 INPUT 설정':game.phase==='play'?`TURN ${game.turnNumber+1}`:game.phase==='reveal'?(resolving?'신호 계산 중':'회로 완성'):'RESULT'
  const connectionLabel=connected?'CONNECTED':connectionState==='reconnecting'?'RECONNECTING…':connectionState==='closed'?'ROOM CLOSED':'CONNECTING…'
  return <LayoutGroup><main className="game-page online-game-page">
    <header className="online-game-bar"><button onClick={leave}>← 나가기</button><div><span>ONLINE ROOM {roomCode}</span><strong>YOU: PLAYER {playerId+1} · {role.toUpperCase()} / OPPONENT: PLAYER {opponentId+1} · {role==='host'?'GUEST':'HOST'}</strong></div><div className={`connection-chip ${connected?'live':''}`}>{connectionLabel}</div></header>
    <IdentityStrip playerId={playerId} role={role} roomCode={roomCode}/>
    <section className="status-row"><div className={`target-badge player-1 ${game.currentPlayer===0?'current':''}`}><span>{playerId===0?'YOU · ':'OPPONENT · '}P1 TARGET</span><strong>{game.players[0].target??'?'}</strong></div><div className="phase-status"><span>{phaseText}</span><strong>{game.phase==='play'?`PLAYER ${game.currentPlayer+1} 차례`:map.description}</strong>{disconnectCount>0&&<small>재연결 {disconnectCount}회</small>}</div><div className={`target-badge player-2 ${game.currentPlayer===1?'current':''}`}><span>{playerId===1?'YOU · ':'OPPONENT · '}P2 TARGET</span><strong>{game.players[1].target??'?'}</strong></div></section>

    {game.phase==='target_choice'&&!coinVisible&&(game.targetChooser===playerId?<TargetChoice playerId={playerId} onChoose={handleTarget}/>:<WaitingPanel>상대가 TARGET을 고르는 중...</WaitingPanel>)}
    {game.phase==='input_selection'&&(inputPlayer===playerId?<InputChoice game={game} playerId={playerId} draft={inputDraft} onChange={(id,value)=>setInputDraft((draft)=>({...draft,[id]:value}))} onSubmit={submitInputs}/>:<WaitingPanel>상대가 비밀 INPUT을 설정하는 중...</WaitingPanel>)}

    {(game.phase==='play'||game.phase==='reveal'||game.phase==='finished')&&<div className="table-layout online-table-layout">
      <div className="opponent-area"><OpponentPrivate playerId={opponentId} roleLabel={role==='host'?'GUEST':'HOST'} isCurrent={game.phase==='play'&&game.currentPlayer===opponentId}/></div>
      <div className="board-zone"><div className="deck-floating"><DeckStack count={game.deck?.length??0} dealing={dealing}/></div><GameBoard map={map} game={game} viewerId={playerId} selectedAction={selectedAction} onSlotClick={placeAction} revealAllInputs={game.phase==='reveal'||game.phase==='finished'||resolving} solution={solution||game.result} revealIndex={game.phase==='finished'?999:revealIndex} resolving={resolving}/>{game.phase==='reveal'&&!resolving&&<motion.button className="run-circuit-button" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} onClick={requestResolution} disabled={connectionState==='closed'||syncingAction}><span>▶</span> 회로 실행</motion.button>}</div>
      <div className="current-area"><PlayerHand player={me} playerId={playerId} isCurrent={myTurn} selectedAction={selectedAction} wildSide={wildSide} onSelectAction={selectAction} onFlipWild={()=>{if(connectionState==='closed')return;setWildSide((side)=>side==='NOT'?'EMPTY':'NOT');sound('flip')}} onDragAction={handleDrag} dealing={dealing}/>{selectedAction&&myTurn&&<div className="placement-hint">카드를 빈 슬롯으로 끌거나 슬롯을 클릭하세요. <button onClick={()=>setSelectedAction(null)}>취소</button></div>}</div>
    </div>}

    <AnimatePresence>{coinVisible&&<CoinOverlay winnerId={game.coinWinner} onDone={()=>setCoinVisible(false)}/>} {dealing&&<motion.div className="deal-banner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>SHUFFLE / DEAL</span><strong>{MAP_BY_ID[game.mapId].level===1?'4':'5'} CARDS EACH</strong></motion.div>} {game.phase==='finished'&&<OnlineResult game={game} playerId={playerId} role={role} onReplay={requestReplay} onMenu={leave}/>}</AnimatePresence>
    {!connected&&<div className="disconnect-banner">{connectionState==='closed'?'방이 종료되었습니다.':'연결이 불안정하지만 계속 선택할 수 있습니다. 행동은 연결이 돌아오면 자동 전달됩니다.'}</div>}
    {syncingAction&&connected&&<div className="sync-banner"><i/><span>상대 기기에 행동을 동기화하는 중…</span></div>}
    {copied&&<div className="copy-toast">초대 문구 · 방 코드 · 링크 복사됨</div>}
  </main></LayoutGroup>
}
