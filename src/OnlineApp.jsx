import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CoinOverlay, GameBoard, MapPreview, PlayerHand, TargetChoice } from './components.jsx'
import { SetupHand, SetupOpponentHand } from './SetupHand.jsx'
import { GameHelp } from './GameHelp.jsx'
import { useDialogFocus } from './useDialogFocus.js'
import { readStored, writeStored } from './storage.js'
import { RULES_VERSION, chooseTarget, createGame, finishGame, nextInputPlayer, legalSlotIds, playMove, recordFromGame, resolveGame, setPlayerInputs } from './game.js'
import { MAPS, MAP_BY_ID } from './maps.js'
import { setSoundEnabled, sound } from './audio.js'
import { createGuestPeer, createHostPeer, inviteUrl, makeRoomCode, snapshotForPlayer } from './online.js'

const STORAGE_KEY = 'logic-gate-duel-playtests-v2'
const PARAMS = new URLSearchParams(window.location.search)
const ROOM_PARAM = PARAMS.get('room')?.toUpperCase() || ''
const HOST_PARAM = PARAMS.get('host')?.toUpperCase() || ''
const HOST_RECOVERY_PREFIX = 'logic-gate-duel-host-room:'

function readRecords() { try { const records=JSON.parse(readStored(STORAGE_KEY, '[]')); return Array.isArray(records)?records:[] } catch { return [] } }
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

function OpponentPrivate({ isCurrent }) {
  return <section className={`opponent-private ${isCurrent ? 'is-current' : ''}`}>
    <div><strong>{isCurrent?'상대가 카드를 고르는 중':'상대 카드'}</strong><small>내용은 공개되지 않습니다.</small></div>
    {isCurrent && <em>상대 차례</em>}
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
  return <main className="online-landing">
    <header className="online-hero"><div><span>친구와 하기</span><h1>방을 만들거나<br/><em>친구 방에 참가하세요.</em></h1></div><div className="online-hero-tools"><a href="/" className="online-back-link">← 처음으로</a></div></header>
    <section className="online-connect-grid">
      <div className="online-panel host-panel"><h2>새 방 만들기</h2><p className="room-first-copy">방을 만들고 초대 링크를 보내세요. 맵은 친구가 들어온 뒤 고릅니다.</p><button className="online-primary" onClick={onHost}>방 만들기</button></div>
      <div className="online-panel join-panel"><h2>방 참가하기</h2><p>초대 링크를 열거나 받은 방 코드를 입력하세요.</p><label>방 코드<input value={roomCode} onChange={(event)=>setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6} autoCapitalize="characters" inputMode="text"/></label><button className="online-primary secondary" disabled={roomCode.length < 6} onClick={()=>onJoin(roomCode)}>참가하기</button></div>
    </section>
  </main>
}

function Lobby({ role, playerId, roomCode, connected, connectionState, disconnectCount, mapId, error, onMapChange, onStart, onShare, onLeave }) {
  const [level, setLevel] = useState(MAP_BY_ID[mapId]?.level || 1)
  const map = MAP_BY_ID[mapId]
  const maps = MAPS.filter((item)=>item.level===level)
  const stateText = connected ? '친구가 들어왔습니다' : connectionState === 'reconnecting' ? '친구의 재연결을 기다리는 중' : '친구를 기다리는 중'
  return <main className="online-lobby"><div className={`lobby-card ${role==='host'?'map-selector-lobby':''}`}>
    <div className="lobby-status"><span className={connected?'dot live':'dot'}/>{stateText}</div>
    <span className="eyebrow">방 코드</span><h1>{roomCode}</h1>
    {role==='host'?<><div className="lobby-map-heading"><strong>맵 선택</strong><small>선택한 맵이 친구 화면에도 바로 보입니다.</small></div><div className="online-level-tabs">{[1,2].map((item)=><button key={item} className={level===item?'active':''} onClick={()=>setLevel(item)}>난이도 {item}</button>)}</div><div className="online-map-list lobby-map-list">{maps.map((item)=><button key={item.id} className={mapId===item.id?'active':''} onClick={()=>onMapChange(item.id)}><div><MapPreview map={item}/></div><span><b>{item.code}</b>{item.name}</span></button>)}</div><div className="lobby-host-actions"><button className="copy-invite share-invite" onClick={onShare}>초대 링크 보내기</button><button className="online-primary" disabled={!connected} onClick={onStart}>{connected?`${map?.name} 시작`:'친구를 기다리는 중'}</button></div></>:<>{map&&<div className="lobby-map"><div><MapPreview map={map}/></div><span>{map.name}</span></div>}<p>{connected?'방장이 맵을 고르고 있습니다.':'방에 연결하는 중입니다.'}</p><div className="lobby-loader"><i/><i/><i/></div></>}
    {disconnectCount>0&&<div className="reconnect-note">연결 복구 중 · 방 상태는 유지됩니다.</div>}{error&&<div className="online-error">{error}</div>}<div className="lobby-actions"><button className="text-exit" onClick={onLeave}>처음으로</button></div>
  </div></main>
}

function WaitingPanel({ children }) { return <motion.div className="phase-panel online-waiting" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><span className="eyebrow">상대 차례</span><h2>{children}</h2><div className="loader-line"/></motion.div> }

function OnlineResult({ game, playerId, role, onReplay, onChooseMap, onMenu }) {
  const [inspect, setInspect] = useState(false)
  const dialogRef = useDialogFocus(!inspect)
  const won = game.result?.winner === playerId
  if (inspect) return <button className="show-result-button" onClick={() => setInspect(false)}>결과 다시 보기</button>
  const winner = game.result?.winner ?? 0
  return createPortal(<motion.div ref={dialogRef} className="online-result-overlay" role="dialog" aria-modal="true" aria-labelledby="online-result-title" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.28}}>
    <div className={`result-burst ${won?'win-burst':'lose-burst'}`}/>
    <motion.div className={`online-result-card ${won?'won':'lost'}`} initial={{scale:.76,y:42,rotateX:10}} animate={{scale:1,y:0,rotateX:0}} exit={{scale:.9,opacity:0}} transition={{type:'spring',stiffness:240,damping:21}}>
      <motion.span initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.18}}>{won?'승리':'패배'}</motion.span>
      <motion.h2 id="online-result-title" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.24}}>{won?'당신이 이겼습니다!':'상대가 이겼습니다'}</motion.h2>
      <motion.div className="result-output-orb" initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{delay:.3,type:'spring',stiffness:280,damping:18}}><small>결과</small><strong>{game.result?.output}</strong></motion.div>
      <div className="result-player-summary">
        {[playerId,1-playerId].map((id,index)=><motion.div key={id} className={`${winner===id?'winner':''} ${playerId===id?'is-me':''}`} initial={{opacity:0,x:index===0?-18:18}} animate={{opacity:1,x:0}} transition={{delay:.38+index*.08}}><span>{playerId===id?'나':'상대'}</span><b>목표 {game.players[id]?.target}</b><em>{winner===id?'승리':'패배'}</em></motion.div>)}
      </div>
      <button className="online-secondary-button" onClick={() => setInspect(true)}>보드 살펴보기</button>
      {role==='host'?<div className="result-actions-online host-result-actions"><button className="online-primary" onClick={onReplay}>이 맵 다시 하기</button><button className="online-secondary-button choose-map-button" onClick={onChooseMap}>다른 맵 선택</button><button className="online-secondary-button" onClick={onMenu}>방 나가기</button></div>:<><p className="rematch-notice waiting"><i/> 방장이 다음 게임을 고르는 중입니다.</p><div className="result-actions-online guest-result-actions"><button className="online-secondary-button" onClick={onMenu}>방 나가기</button></div></>}
    </motion.div>
  </motion.div>, document.body)
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
  const [inputSelected,setInputSelected] = useState(null)
  const [soundOn,setSoundOn] = useState(() => readStored('logic-gate-duel-sound') !== 'off')
  const [coinVisible,setCoinVisible] = useState(false)
  const [dealing,setDealing] = useState(false)
  const [solution,setSolution] = useState(null)
  const [revealIndex,setRevealIndex] = useState(-1)
  const [resolving,setResolving] = useState(false)
  const [copied,setCopied] = useState(false)
  const [syncingAction,setSyncingAction] = useState(false)
  const [rematchRequested,setRematchRequested] = useState(false)
  const [rematchStatus,setRematchStatus] = useState('idle')
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

  useEffect(()=>{ setSoundEnabled(soundOn); writeStored('logic-gate-duel-sound',soundOn?'on':'off') },[soundOn])
  useEffect(()=>()=>cleanup(),[])
  useEffect(()=>{ const cancel=event=>{if(event.key==='Escape')setSelectedAction(null)}; window.addEventListener('keydown',cancel); return()=>window.removeEventListener('keydown',cancel) },[])
  useEffect(()=>{
    if(HOST_PARAM) resumeHostRoom(HOST_PARAM)
    else if(ROOM_PARAM) joinRoom(ROOM_PARAM)
  },[])
  useEffect(()=>{ if(role==='host'&&game?.phase==='reveal'&&!resolvingRef.current)beginResolutionHost() },[role,game?.phase])

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
  function showStart(snapshot){ clearTimers(); resolvingRef.current=false; setInputSelected(null); const normalized=normalizeRemoteGame(snapshot); setGame(normalized); setScreen('game'); setSelectedAction(null); setInputDraft({}); setWildSide('NOT'); setSolution(null); setRevealIndex(-1); setResolving(false); setSyncingAction(false); setRematchRequested(false); setRematchStatus('idle'); setCoinVisible(true); sound('turn') }

  function createHostSession(code,selectedMapId,{resumeGame=null}={}){
    const session=createHostPeer(code,{
      onReady:()=>session.setMeta?.({mapId:selectedMapId}),
      onConnected:()=>{
        markConnected()
        const current=fullGameRef.current
        if(current) session.send({type:'state',game:snapshotForPlayer(current,1),meta:{reconnected:true}})
        else session.send({type:'lobby',mapId:mapRef.current,roomCode:code})
      },
      onDisconnected:markDisconnected,
      onError:markError,
      onData:(data,messageId)=>handleHostData(data,messageId),
    })
    sessionRef.current=session
    if(resumeGame){ fullGameRef.current=resumeGame; setGame(resumeGame); setScreen('game'); setCoinVisible(false); setSolution(resumeGame.result||null); setRevealIndex(resumeGame.phase==='finished'?999:-1) }
    return session
  }

  function createRoom(){
    cleanup(); resetConnectionTracking()
    const selectedMapId=MAPS[0].id
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
    const compatibleGame=recovery.game?.rulesVersion===RULES_VERSION?recovery.game:null
    setScreen(compatibleGame?'game':'lobby')
    if(recovery.game&&!compatibleGame){setError('규칙이 업데이트되었습니다. 같은 방에서 새 판을 시작하세요.');saveHostRecovery(null)}
    createHostSession(code,mapRef.current,{resumeGame:compatibleGame})
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
    if(role!=='host'||connectionState==='closed'||(screen==='lobby'&&!connected))return
    const next={...createGame(mapRef.current,'online',seed??undefined),revision:0,updatedAt:Date.now()}; fullGameRef.current=next; saveHostRecovery(next); showStart(next)
    sessionRef.current?.setMeta?.({mapId:mapRef.current,status:'playing'})
    sessionRef.current?.send({type:'start',game:snapshotForPlayer(next,1)})
  }

  function selectLobbyMap(selectedMapId){
    if(role!=='host'||!MAP_BY_ID[selectedMapId])return
    mapRef.current=selectedMapId; setMapId(selectedMapId); saveHostRecovery(null)
    sessionRef.current?.setMeta?.({mapId:selectedMapId,status:'lobby'})
    sessionRef.current?.send({type:'lobby',mapId:selectedMapId,roomCode:roomRef.current})
    sound('flip')
  }

  function chooseAnotherMap(){
    if(role!=='host')return
    clearTimers(); fullGameRef.current=null; setGame(null); setScreen('lobby'); setCoinVisible(false); setSolution(null); setRevealIndex(-1); setResolving(false); resolvingRef.current=false; saveHostRecovery(null)
    sessionRef.current?.setMeta?.({mapId:mapRef.current,status:'lobby'})
    sessionRef.current?.send({type:'lobby',mapId:mapRef.current,roomCode:roomRef.current})
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
      if(current.currentPlayer!==1){sessionRef.current?.send({type:'state',game:snapshotForPlayer(current,1)});return} const next=playMove(current,data.slotId,data.action); if(next!==current)hostCommit(next,{sound:'place'})
    } else if(data.command==='resolve') beginResolutionHost()
    if(data.command!=='resolve'&&fullGameRef.current===current)sessionRef.current?.send({type:'state',game:snapshotForPlayer(current,1),meta:{rejected:true}})
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
    if(!connected||syncingAction||!sessionRef.current)return false
    setSyncingAction(true)
    sessionRef.current?.send({type:'command',command,expectedRevision:Number(game?.revision||0),...values})
    return true
  }

  function handleTarget(value){
    if(!connected||syncingAction||!game||game.targetChooser!==playerId)return
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

  function selectAction(action){ if(!connected||syncingAction||!game||game.phase!=='play'||game.currentPlayer!==playerId||dealing||resolving)return; setSelectedAction((current)=>current?.cardId===action.cardId&&current?.kind===action.kind?null:action) }
  function placeAction(slotId,action=selectedAction){
    if(!connected||syncingAction||dealing||resolving||!action||!game||game.phase!=='play'||game.currentPlayer!==playerId)return
    if(!legalSlotIds(game,action,playerId).includes(slotId))return
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
    const duration=1150+result.revealOrder.length*760
    later(()=>{ const finished=finishGame(fullGameRef.current,result); hostCommit(finished); logFinishedGame(finished); resolvingRef.current=false; sound('win') },duration)
  }
  function beginResolutionLocal(result){
    if(resolvingRef.current)return
    resolvingRef.current=true; setSolution(result); setResolving(true); setRevealIndex(-1); sound('flip')
    result.revealOrder.forEach((nodeId,index)=>later(()=>{ setRevealIndex(index); sound('signal',{value:result.signals[nodeId]}) },650+index*760))
    later(()=>{ setResolving(false); resolvingRef.current=false },1050+result.revealOrder.length*760)
  }
  function requestResolution(){ if(connectionState==='closed')return; if(role==='host')beginResolutionHost(); else sendGuestCommand('resolve') }
  function requestReplay(){
    if(!connected)return
    if(role==='host')startMatch()
  }

  async function shareInvite(){
    const code=roomRef.current || roomCode
    const url=inviteUrl(code)
    const fullText=`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}\n너는 PLAYER 2로 입장해.\n바로 입장: ${url}`
    if(navigator.share){
      try { await navigator.share({title:'LOGIC GATE DUEL',text:`방 코드: ${code}`,url}); return }
      catch(error){ if(error?.name==='AbortError')return }
    }
    try { await navigator.clipboard.writeText(fullText); setCopied(true); later(()=>setCopied(false),1800) }
    catch { setError(`복사하지 못했습니다. 방 코드 ${code}를 친구에게 알려주세요.`) }
  }
  async function leave(){
    if(game && game.phase !== 'finished' && !window.confirm('진행 중인 게임에서 나갈까요?'))return
    logAbandonedGame(); clearTimers()
    try{ if(role==='host')await sessionRef.current?.closeRoom?.(); else await sessionRef.current?.destroy?.() }catch{}
    if(role==='host')clearHostRecovery(); sessionRef.current=null
    const url=new URL(window.location.href); url.search=''; window.location.href=url.toString()
  }

  if(screen==='landing')return <><OnlineLanding onHost={createRoom} onJoin={joinRoom} roomCode={roomCode} setRoomCode={setRoomCode}/>{error&&<div className="disconnect-banner" role="alert">{error}</div>}</>
  if(screen==='lobby'&&role&&playerId!==null)return <><Lobby role={role} playerId={playerId} roomCode={roomCode} connected={connected} connectionState={connectionState} disconnectCount={disconnectCount} mapId={mapId} error={error} onMapChange={selectLobbyMap} onStart={()=>startMatch()} onShare={shareInvite} onLeave={leave}/>{copied&&<div className="copy-toast" role="status">초대 링크를 복사했어요</div>}</>
  if(!game||playerId===null||!role)return null

  const me=game.players[playerId]
  const myTurn=connected&&!syncingAction&&game.phase==='play'&&game.currentPlayer===playerId&&!dealing&&!resolving
  const phaseText=game.phase==='target_choice'?'목표 선택':game.phase==='input_selection'?'입력 카드':game.phase==='play'?(myTurn?'내 차례':'상대 차례'):game.phase==='reveal'?'계산 중':'게임 종료'
  const connectionLabel=connected?'CONNECTED':connectionState==='reconnecting'?'RECONNECTING…':connectionState==='closed'?'ROOM CLOSED':'CONNECTING…'
  return <LayoutGroup><main className="game-page online-game-page">
    <header className="online-game-bar simplified"><button onClick={leave}>← 나가기</button><div><strong>{map.name}</strong></div><div className="topbar-right"><GameHelp/><button className="help-button" aria-pressed={soundOn} onClick={()=>setSoundOn(value=>!value)}>{soundOn?'소리 켜짐':'소리 꺼짐'}</button>{!connected&&<span className="connection-chip">{connectionLabel}</span>}</div></header>
    <section className={`status-row focus-status ${myTurn?'is-my-turn':'is-opponent-turn'}`}><div className={`target-badge player-${playerId+1} ${myTurn?'current':''}`}><span>내 목표</span><strong>{game.players[playerId].target??'?'}</strong></div><div className="phase-status" role="status" aria-live="polite"><span>{phaseText}</span><strong>{game.phase==='play'?(myTurn?(selectedAction?'빛나는 자리에 놓으세요':'카드를 누르거나 보드로 드래그하세요'):'상대가 카드를 놓을 때까지 기다리세요'):''}</strong></div><div className={`target-badge player-${opponentId+1} ${game.phase==='play'&&!myTurn?'current':''}`}><span>상대 목표</span><strong>{game.players[opponentId].target??'?'}</strong></div></section>

    {game.phase==='target_choice'&&!coinVisible&&(game.targetChooser===playerId?<TargetChoice playerId={playerId} personal onChoose={handleTarget}/>:<WaitingPanel>상대가 목표를 고르는 중입니다.</WaitingPanel>)}
    {game.phase==='input_selection'&&<div className="table-layout setup-table"><div className="opponent-area"><SetupOpponentHand game={game} playerId={opponentId}/></div><div className="board-zone"><GameBoard map={map} game={game} viewerId={playerId} selectedAction={null} onSlotClick={()=>{}} inputSelection={inputPlayer===playerId?{playerId,draft:inputDraft,selected:inputSelected,onPlace:(id)=>setInputDraft(draft=>({...draft,[id]:draft[id]===undefined?0:1-draft[id]}))}:null}/></div><div className="current-area">{inputPlayer===playerId?<SetupHand game={game} playerId={playerId} personal draft={inputDraft} selected={inputSelected} onSelect={setInputSelected} onPlace={(id,value)=>{setInputDraft(draft=>({...draft,[id]:value}));setInputSelected(null)}} onSubmit={submitInputs} disabled={!connected||syncingAction}/>:<WaitingPanel>상대가 비밀 입력을 정하고 있어요</WaitingPanel>}</div></div>}

    {(game.phase==='play'||game.phase==='reveal'||game.phase==='finished')&&<div className="table-layout online-table-layout">
      <div className="opponent-area"><OpponentPrivate isCurrent={game.phase==='play'&&game.currentPlayer===opponentId}/></div>
      <div className="board-zone"><GameBoard map={map} game={game} viewerId={playerId} selectedAction={selectedAction} onSlotClick={placeAction} revealAllInputs={game.phase==='reveal'||game.phase==='finished'||resolving} solution={solution||game.result} revealIndex={game.phase==='finished'?999:revealIndex} resolving={resolving}/></div>
      <div className="current-area"><PlayerHand game={game} player={me} playerId={playerId} label="내 카드" isCurrent={myTurn} selectedAction={selectedAction} wildSide={wildSide} onSelectAction={selectAction} onFlipWild={()=>{if(connectionState==='closed')return;const side=wildSide==='NOT'?'EMPTY':'NOT';setWildSide(side);setSelectedAction({kind:'wild',cardId:`wild-p${playerId}`,side});sound('flip')}} onDragAction={handleDrag} dealing={dealing}/>{selectedAction&&myTurn&&<div className="placement-hint">빛나는 빈칸에 놓으세요. <button onClick={()=>setSelectedAction(null)}>취소</button></div>}</div>
    </div>}

    <AnimatePresence>{coinVisible&&<CoinOverlay winnerId={game.coinWinner} viewerId={playerId} onDone={()=>setCoinVisible(false)}/>} {dealing&&<motion.div className="deal-banner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>카드 준비 중</span><strong>잠시만 기다려 주세요</strong></motion.div>} {game.phase==='finished'&&<OnlineResult game={game} playerId={playerId} role={role} onReplay={requestReplay} onChooseMap={chooseAnotherMap} onMenu={leave}/>}</AnimatePresence>
    {!connected&&<div className="disconnect-banner">{connectionState==='closed'?'방이 종료되었습니다.':'연결을 복구하고 있어요. 게임은 유지되며 연결되면 계속할 수 있습니다.'}</div>}
    {syncingAction&&connected&&<div className="sync-banner"><i/><span>상대 기기에 행동을 동기화하는 중…</span></div>}
    {error&&<div className="online-error" role="alert">{error}</div>}
    {copied&&<div className="copy-toast">초대 문구 · 방 코드 · 링크 복사됨</div>}
  </main></LayoutGroup>
}

