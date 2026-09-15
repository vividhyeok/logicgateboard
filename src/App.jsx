import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { chooseCpuMove, chooseTarget, createGame, finishGame, nextInputPlayer, playMove, randomInputsForPlayer, recordFromGame, resolveGame, setPlayerInputs } from './game.js'
import { MAPS, MAP_BY_ID } from './maps.js'
import { setSoundEnabled, sound } from './audio.js'
import { CoinOverlay, DeckStack, GameBoard, InputChoice, MapPreview, PlayerHand, ResultOverlay, TargetChoice, TurnCurtain } from './components.jsx'

const STORAGE_KEY = 'logic-gate-duel-playtests-v2'
const SOUND_KEY = 'logic-gate-duel-sound'
const RESOLVE_START_MS = 420
const RESOLVE_STEP_MS = 520
const RESOLVE_END_MS = 620
function readRecords() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }

function Icon({ name }) {
  const paths = {
    sound: <><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9c1.7 1.7 1.7 4.3 0 6M18.5 6.5c3.1 3.1 3.1 8.9 0 12"/></>,
    mute: <><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="m17 9 5 6M22 9l-5 6"/></>,
    full: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  }
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Menu({ mode, setMode, level, setLevel, onStart, records, soundOn, onToggleSound, onExport }) {
  const maps = MAPS.filter((map) => map.level === level)
  return <motion.main className="menu-page" initial={{opacity:0}} animate={{opacity:1}}>
    <header className="menu-header"><div className="brand-lockup"><a className="brand-tile home-tile" href="/" aria-label="처음 화면">←</a><div><span>혼자 하기</span><h1>맵을 고르세요</h1><p>카드를 놓아 원하는 결과를 만드세요.</p></div></div><div className="menu-tools"><button className="icon-text-button" onClick={onToggleSound}><Icon name={soundOn?'sound':'mute'}/> {soundOn?'소리 켜짐':'소리 꺼짐'}</button></div></header>
    <section className="menu-control-grid solo-controls"><div className="level-picker">{[1,2].map((item)=><button key={item} className={level===item?'active':''} onClick={()=>setLevel(item)}>난이도 {item}<small>{item===1?'빠른 게임':'긴 게임'}</small></button>)}</div></section>
    <section className="map-select"><div className="section-heading"><small>맵 선택</small></div><div className="map-card-grid">{maps.map((map,index)=><motion.article key={map.id} className="map-select-card" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:index*.07}}><div className="map-paper-preview"><MapPreview map={map}/></div><div className="map-card-body"><div><h2>{map.name}</h2></div><button onClick={()=>onStart(map.id)}>시작 <span>→</span></button></div></motion.article>)}</div></section>
  </motion.main>
}

function TargetBadge({ playerId, label, target, current }) { return <motion.div className={`target-badge player-${playerId+1} ${current?'current':''}`} animate={current?{scale:[1,1.035,1]}:{scale:1}} transition={{repeat:current?Infinity:0,duration:1.7}}><span>{label}</span><strong>{target??'?'}</strong></motion.div> }
function GameTopbar({ map, soundOn, onToggleSound, onMenu, onFullscreen }) { return <header className="game-topbar"><button className="round-icon-button" onClick={onMenu} title="맵 선택"><Icon name="back"/></button><div className="game-title"><strong>{map.name}</strong></div><div className="topbar-right"><button className="round-icon-button" onClick={onToggleSound}><Icon name={soundOn?'sound':'mute'}/></button><button className="round-icon-button" onClick={onFullscreen}><Icon name="full"/></button></div></header> }

export default function App() {
  const [screen,setScreen]=useState('menu'); const [mode,setMode]=useState('cpu'); const [level,setLevel]=useState(1); const [game,setGame]=useState(null)
  const [coinVisible,setCoinVisible]=useState(false); const [inputCurtain,setInputCurtain]=useState(false); const [turnCurtain,setTurnCurtain]=useState(false)
  const [inputDraft,setInputDraft]=useState({}); const [selectedAction,setSelectedAction]=useState(null); const [wildSides,setWildSides]=useState({0:'NOT',1:'NOT'})
  const [dealing,setDealing]=useState(false); const [cpuThinking,setCpuThinking]=useState(false); const [solution,setSolution]=useState(null); const [revealIndex,setRevealIndex]=useState(-1); const [resolving,setResolving]=useState(false)
  const [records,setRecords]=useState(()=>readRecords()); const [soundOn,setSoundOn]=useState(()=>localStorage.getItem(SOUND_KEY)!=='off'); const timeouts=useRef([]); const resolutionStarted=useRef(false)
  const map=game?MAP_BY_ID[game.mapId]:null; const viewerId=game?(game.mode==='local'?game.currentPlayer:0):0; const opponentId=1-viewerId; const inputPlayer=game?.phase==='input_selection'?nextInputPlayer(game):null

  useEffect(()=>{ setSoundEnabled(soundOn); localStorage.setItem(SOUND_KEY,soundOn?'on':'off') },[soundOn])
  useEffect(()=>()=>timeouts.current.forEach(clearTimeout),[])
  useEffect(()=>{ if(!game||screen!=='game'||coinVisible)return; if(game.mode==='cpu'&&game.phase==='target_choice'&&game.targetChooser===1){ const timer=window.setTimeout(()=>setGame((current)=>chooseTarget(current,1,((game.seed>>>2)&1))),650); return()=>clearTimeout(timer) } },[game,screen,coinVisible])
  useEffect(()=>{ if(!game||game.mode!=='cpu'||game.phase!=='play'||game.currentPlayer!==1||dealing||resolving||cpuThinking)return; setCpuThinking(true); const timer=window.setTimeout(()=>{ setGame((current)=>{ const move=chooseCpuMove(current); if(!move)return current; sound('place'); return playMove(current,move.slotId,move.action) }); setSelectedAction(null); setCpuThinking(false) },780); return()=>clearTimeout(timer) },[game,dealing,resolving])
  useEffect(()=>{ if(game?.phase==='reveal'&&!resolutionStarted.current)runCircuit() },[game?.phase])

  function queueTimeout(fn,ms){ const id=window.setTimeout(fn,ms); timeouts.current.push(id); return id }
  function startGame(mapId,sameSeed=null){ timeouts.current.forEach(clearTimeout); timeouts.current=[]; resolutionStarted.current=false; const next=createGame(mapId,mode,sameSeed??undefined); setGame(next); setScreen('game'); setCoinVisible(true); setInputCurtain(false); setTurnCurtain(false); setInputDraft({}); setSelectedAction(null); setWildSides({0:'NOT',1:'NOT'}); setDealing(false); setSolution(null); setRevealIndex(-1); setResolving(false) }
  function goMenu(){ timeouts.current.forEach(clearTimeout); timeouts.current=[]; setScreen('menu'); setGame(null); setSelectedAction(null); setSolution(null); setRevealIndex(-1); setResolving(false) }
  function afterCoin(){ setCoinVisible(false); sound('turn') }
  function handleTarget(value){ const next=chooseTarget(game,game.targetChooser,value); setGame(next); setInputDraft({}); if(next.mode==='local')setInputCurtain(true); sound('flip') }
  function beginDeal(nextGame){ setGame(nextGame); setDealing(true); setSelectedAction(null); const handSize=nextGame.players[0].hand.length+nextGame.players[1].hand.length; for(let index=0;index<handSize;index+=1)queueTimeout(()=>sound('deal'),100+index*70); queueTimeout(()=>{ setDealing(false); if(nextGame.mode==='local')setTurnCurtain(true); else if(nextGame.currentPlayer===0)sound('turn') },450+handSize*70) }
  function submitInputs(){ if(inputPlayer===null)return; let next=setPlayerInputs(game,inputPlayer,inputDraft); sound('flip'); setInputDraft({}); if(next.mode==='cpu'&&next.phase==='input_selection')next=setPlayerInputs(next,1,randomInputsForPlayer(next,1)); if(next.phase==='play')beginDeal(next); else { setGame(next); if(next.mode==='local')setInputCurtain(true) } }
  function selectAction(action){ if(dealing||resolving||game?.phase!=='play')return; setSelectedAction((current)=>current?.cardId===action.cardId&&current?.kind===action.kind?null:action) }
  function placeAction(slotId,action=selectedAction){ if(!action||!game||game.phase!=='play')return; const next=playMove(game,slotId,action); if(next===game)return; sound('place'); setSelectedAction(null); setGame(next); if(next.mode==='local'&&next.phase==='play')setTurnCurtain(true) }
  function handleDrag(action,event){ const x=event?.clientX??event?.nativeEvent?.clientX; const y=event?.clientY??event?.nativeEvent?.clientY; if(x===undefined||y===undefined)return; const slot=document.elementsFromPoint(x,y).find((element)=>element?.dataset?.slotId); if(slot?.dataset?.slotId)placeAction(slot.dataset.slotId,action) }
  function runCircuit(){
    if(!game||game.phase!=='reveal'||resolving||resolutionStarted.current)return
    resolutionStarted.current=true
    const resolved=resolveGame(game)
    setSolution(resolved)
    setRevealIndex(-1)
    setResolving(true)
    sound('flip')
    resolved.revealOrder.forEach((nodeId,index)=>queueTimeout(()=>{
      setRevealIndex(index)
      sound('signal',{value:resolved.signals[nodeId]})
    },RESOLVE_START_MS+index*RESOLVE_STEP_MS))
    const finishDelay=RESOLVE_START_MS+Math.max(0,resolved.revealOrder.length-1)*RESOLVE_STEP_MS+RESOLVE_END_MS
    queueTimeout(()=>{
      const finished=finishGame(game,resolved)
      setGame(finished)
      setRevealIndex(999)
      setResolving(false)
      sound('win')
      const record=recordFromGame(finished)
      setRecords((current)=>{ const next=[...current,record]; localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); return next })
    },finishDelay)
  }
  function saveFeedback(feedback){ if(!game)return; setRecords((current)=>{ const next=current.map((record,index)=>index===current.length-1&&record.seed===game.seed?{...record,feedback}:record); localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); return next }) }
  function exportRecords(){ if(!records.length)return; const blob=new Blob([JSON.stringify(records,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const anchor=document.createElement('a'); anchor.href=url; anchor.download=`logic-gate-duel-playtests-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url) }
  function toggleFullscreen(){ if(document.fullscreenElement)document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.() }
  const phaseText=useMemo(()=>{ if(!game)return''; if(game.phase==='target_choice')return'목표 선택'; if(game.phase==='input_selection')return'입력 선택'; if(game.phase==='play')return game.currentPlayer===0?'내 차례':'상대 차례'; if(game.phase==='reveal')return'계산 중'; return'' },[game])

  if(screen==='menu'||!game||!map)return <Menu mode={mode} setMode={setMode} level={level} setLevel={setLevel} onStart={startGame} records={records} soundOn={soundOn} onToggleSound={()=>setSoundOn((value)=>!value)} onExport={exportRecords}/>
  const currentPlayer=game.players[viewerId]; const opponentPlayer=game.players[opponentId]; const currentWild=wildSides[viewerId]
  return <LayoutGroup><main className="game-page">
    <GameTopbar map={map} soundOn={soundOn} onToggleSound={()=>setSoundOn((value)=>!value)} onMenu={goMenu} onFullscreen={toggleFullscreen}/>
    <section className={`status-row focus-status ${game.currentPlayer===0?'is-my-turn':'is-opponent-turn'}`}><TargetBadge playerId={0} label="내 목표" target={game.players[0].target} current={game.phase==='play'&&game.currentPlayer===0}/><div className="phase-status"><span>{phaseText}</span><strong>{game.phase==='play'?(game.currentPlayer===0?'카드를 선택해 빈칸에 놓으세요':'상대가 카드를 고르는 중입니다'):''}</strong>{cpuThinking&&<small className="thinking-dots">생각하는 중…</small>}</div><TargetBadge playerId={1} label="상대 목표" target={game.players[1].target} current={game.phase==='play'&&game.currentPlayer===1}/></section>
    {game.phase==='target_choice'&&!coinVisible&&!(game.mode==='cpu'&&game.targetChooser===1)&&<TargetChoice playerId={game.targetChooser} personal={game.mode==='cpu'} onChoose={handleTarget}/>}
    {game.phase==='target_choice'&&!coinVisible&&game.mode==='cpu'&&game.targetChooser===1&&<div className="phase-panel cpu-choice"><span className="eyebrow">상대 차례</span><h2>상대가 목표를 고르는 중...</h2><div className="loader-line"/></div>}
    {game.phase==='input_selection'&&!inputCurtain&&inputPlayer!==null&&!(game.mode==='cpu'&&inputPlayer===1)&&<InputChoice game={game} playerId={inputPlayer} personal={game.mode==='cpu'} draft={inputDraft} onChange={(id,value)=>setInputDraft((draft)=>({...draft,[id]:value}))} onSubmit={submitInputs}/>}
    {(game.phase==='play'||game.phase==='reveal'||game.phase==='finished')&&<div className="table-layout">
      <div className="opponent-area"><PlayerHand player={opponentPlayer} playerId={opponentId} label="상대 카드" isCurrent={game.phase==='play'&&game.currentPlayer===opponentId} selectedAction={selectedAction} wildSide={wildSides[opponentId]} dealing={dealing} opponent/></div>
      <div className="board-zone"><div className="deck-floating"><DeckStack count={game.deck.length} dealing={dealing}/></div><GameBoard map={map} game={game} viewerId={viewerId} selectedAction={selectedAction} onSlotClick={placeAction} revealAllInputs={game.phase==='reveal'||game.phase==='finished'||resolving} solution={solution||game.result} revealIndex={game.phase==='finished'?999:revealIndex} resolving={resolving}/></div>
      <div className="current-area"><PlayerHand player={currentPlayer} playerId={viewerId} label="내 카드" isCurrent={game.phase==='play'&&game.currentPlayer===viewerId&&!dealing&&!(game.mode==='cpu'&&viewerId===1)} selectedAction={selectedAction} wildSide={currentWild} onSelectAction={selectAction} onFlipWild={()=>{setWildSides((sides)=>({...sides,[viewerId]:sides[viewerId]==='NOT'?'EMPTY':'NOT'}));sound('flip')}} onDragAction={handleDrag} dealing={dealing}/>{selectedAction&&game.phase==='play'&&<div className="placement-hint">빛나는 빈칸에 놓으세요. <button onClick={()=>setSelectedAction(null)}>취소</button></div>}</div>
    </div>}
    <AnimatePresence>{coinVisible&&<CoinOverlay winnerId={game.coinWinner} viewerId={game.mode==='cpu'?0:null} onDone={afterCoin}/>} {inputCurtain&&game.phase==='input_selection'&&inputPlayer!==null&&<TurnCurtain playerId={inputPlayer} onReady={()=>{setInputCurtain(false);sound('turn')}}/>} {turnCurtain&&game.mode==='local'&&game.phase==='play'&&!dealing&&<TurnCurtain playerId={game.currentPlayer} onReady={()=>{setTurnCurtain(false);sound('turn')}}/>} {dealing&&<motion.div className="deal-banner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>카드 준비 중</span></motion.div>} {game.phase==='finished'&&<ResultOverlay game={game} map={map} onReplay={()=>startGame(game.mapId,game.seed)} onNewSeed={()=>startGame(game.mapId)} onMenu={goMenu} onSaveFeedback={saveFeedback}/>}</AnimatePresence>
    <div className="portrait-hint"><strong>가로 화면 권장</strong><span>카드와 판을 한눈에 보려면 기기를 가로로 돌려주세요.</span></div>
  </main></LayoutGroup>
}
