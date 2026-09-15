import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PLAYER_META, getActionForCard, getWildAction, inputOwner, legalSlotIds, visibleInputValue } from './game.js'
import { wirePath } from './maps.js'

const CARD_META = {
  AND: { className: 'card-and', hint: '둘 다 1' }, NAND: { className: 'card-nand', hint: 'AND 반전' },
  OR: { className: 'card-or', hint: '하나라도 1' }, NOR: { className: 'card-nor', hint: 'OR 반전' }, XOR: { className: 'card-xor', hint: '서로 다름' },
}

export function GateIcon({ type, className = '' }) {
  const bubble = type === 'NAND' || type === 'NOR'
  const base = type === 'XOR' ? 'OR' : type.replace('N', '')
  return (
    <svg className={`gate-icon ${className}`} viewBox="0 0 86 66" aria-hidden="true">
      {base === 'AND' && <path d="M14 9 H39 C58 9 69 20 69 33 C69 46 58 57 39 57 H14 Z" />}
      {base === 'OR' && <><path d="M14 9 C29 17 30 49 14 57 C36 60 58 58 70 33 C58 8 36 6 14 9 Z" />{type === 'XOR' && <path d="M7 9 C22 20 23 46 7 57" />}</>}
      {bubble && <circle cx="76" cy="33" r="5.5" />}
      <path className="gate-pin" d="M3 23 H14 M3 43 H14 M69 33 H82" />
    </svg>
  )
}

export function CardBack({ small = false }) {
  return <div className={`card-back ${small ? 'small' : ''}`}><div className="card-back-ring"><span>LG</span></div><b>DUEL</b></div>
}

export function GateCard({ card, compact = false, selected = false, disabled = false, owner = null, onSelect, onDragEnd, dealFromCenter = false, dealDelay = 0, layoutId }) {
  const meta = CARD_META[card.type] || CARD_META.AND
  const dragEnabled = !compact && !disabled && Boolean(onDragEnd)
  return (
    <motion.button type="button" layoutId={layoutId || `card-${card.id}`} className={`logic-card ${meta.className} ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
      onClick={disabled ? undefined : onSelect} disabled={disabled} drag={dragEnabled} dragSnapToOrigin dragElastic={0.12} dragMomentum={false}
      whileDrag={{ scale: 1.09, rotate: 0, zIndex: 80, cursor: 'grabbing' }} onDragEnd={onDragEnd}
      initial={dealFromCenter ? { y: owner === 0 ? -340 : 340, x: 0, scale: 0.38, rotate: owner === 0 ? 16 : -16, opacity: 0 } : false}
      animate={{ y: 0, x: 0, scale: 1, rotate: 0, opacity: 1 }}
      transition={dealFromCenter ? { type: 'spring', stiffness: 380, damping: 28, delay: dealDelay } : { type: 'spring', stiffness: 500, damping: 35 }} aria-label={`${card.type} 카드`}>
      <span className="card-corner top">{card.type}</span><div className="card-swoosh" />
      <div className="card-core"><GateIcon type={card.type} /><strong>{card.type}</strong>{!compact && <small>{meta.hint}</small>}</div>
      <span className="card-corner bottom">{card.type}</span>{owner !== null && <span className={`card-owner player-${owner + 1}`}>P{owner + 1}</span>}
    </motion.button>
  )
}

export function WildCard({ playerId, side = 'NOT', compact = false, selected = false, disabled = false, onSelect, onFlip, onDragEnd, dealFromCenter = false }) {
  const dragEnabled = !compact && !disabled && Boolean(onDragEnd)
  return (
    <div className={`wild-wrap ${compact ? 'compact-wrap' : ''}`}>
      <motion.button type="button" layoutId={`wild-p${playerId}`} className={`logic-card wild-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
        onClick={disabled ? undefined : onSelect} disabled={disabled} drag={dragEnabled} dragSnapToOrigin dragElastic={0.12} dragMomentum={false}
        whileDrag={{ scale: 1.09, rotate: 0, zIndex: 80, cursor: 'grabbing' }} onDragEnd={onDragEnd}
        initial={dealFromCenter ? { y: playerId === 0 ? -330 : 330, scale: 0.4, rotateY: 90, opacity: 0 } : false}
        animate={{ y: 0, scale: 1, rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: dealFromCenter ? 0.58 : 0 }} aria-label={`Wild ${side} 카드`}>
        <div className="wild-half wild-not" /><div className="wild-half wild-empty" /><span className="card-corner top">WILD</span>
        <div className="card-core wild-core"><motion.div key={side} initial={{ rotateY: 88, opacity: 0.25 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.24 }} className="wild-face"><strong>{side}</strong>{!compact && <small>{side === 'NOT' ? '신호 반전' : '그대로 통과'}</small>}</motion.div></div>
        <span className="card-corner bottom">WILD</span><span className={`card-owner player-${playerId + 1}`}>P{playerId + 1}</span>
      </motion.button>
      {!compact && !disabled && <button type="button" className="wild-flip-button" onClick={(event) => { event.stopPropagation(); onFlip?.() }}>↻ {side === 'NOT' ? 'EMPTY' : 'NOT'}</button>}
    </div>
  )
}

function SignalDot({ value }) { return <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`signal-dot signal-${value}`}>{value}</motion.span> }
function BoardInputCard({ id, value, owner, reveal, activeSignal }) {
  const shown = reveal ? value : null
  return <motion.div className={`board-value-card input-value-card owner-${owner + 1}`} animate={{ rotateY: shown === null ? 180 : 0 }} transition={{ duration: 0.42 }}>
    <div className="value-card-inner"><div className="value-card-front"><span>INPUT {id}</span><strong>{shown ?? '?'}</strong><em>P{owner + 1}</em></div><div className="value-card-back"><span>INPUT</span><strong>?</strong></div></div>
    {activeSignal !== undefined && <SignalDot value={activeSignal} />}
  </motion.div>
}
function OutputCard({ value, revealed }) {
  return <motion.div className="board-value-card output-value-card" animate={{ rotateY: revealed ? 0 : 180 }} transition={{ duration: 0.5 }}><div className="value-card-inner"><div className="value-card-front"><span>OUTPUT</span><strong>{revealed ? value : '?'}</strong></div><div className="value-card-back"><span>OUTPUT</span><strong>?</strong></div></div></motion.div>
}

export function MapPreview({ map }) {
  return <svg className="map-preview-svg" viewBox="0 0 1000 520" aria-hidden="true">
    {map.edges.map((edge) => <path key={edge.join('-')} d={wirePath(map, edge)} className="preview-wire" />)}
    {map.nodes.map((node) => { const isSlot = node.type === 'gate' || node.type === 'wild'; return <g key={node.id} transform={`translate(${node.x} ${node.y})`}>{isSlot ? <rect x="-33" y="-47" width="66" height="94" rx="8" className={node.type === 'wild' ? 'preview-slot wild' : 'preview-slot'} /> : <rect x="-24" y="-34" width="48" height="68" rx="7" className={node.type === 'output' ? 'preview-io output' : 'preview-io'} />}</g> })}
  </svg>
}

export function GameBoard({ map, game, viewerId, selectedAction, onSlotClick, revealAllInputs = false, solution = null, revealIndex = -1, resolving = false }) {
  const legalSlots = selectedAction ? legalSlotIds(game, selectedAction) : []
  const revealNodeIndex = useMemo(() => !solution ? {} : Object.fromEntries(solution.revealOrder.map((id, index) => [id, index])), [solution])
  const nodeRevealed = (nodeId, type) => solution ? (type === 'input' ? revealAllInputs : revealNodeIndex[nodeId] !== undefined && revealIndex >= revealNodeIndex[nodeId]) : false
  return (
    <motion.section className="board-frame" initial={{ opacity: 0, scale: 0.94, rotateX: 9 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
      <div className="board-print-header"><div><span>LOGIC GATE DUEL</span><strong>{map.code} · {map.name}</strong></div><div className="board-print-meta">CIRCUIT MAP / {map.level === 1 ? 'BASIC' : 'ADVANCED'}</div></div>
      <div className="board-canvas" data-resolving={resolving ? 'true' : 'false'}>
        <svg className="board-wires" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="wireGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          {map.edges.map((edge) => { const [from,to] = edge; const toNode = map.nodes.find((node) => node.id === to); const active = solution && nodeRevealed(to,toNode.type); const value = solution?.signals?.[from]; const path = wirePath(map,edge); return <g key={edge.join('-')}><path d={path} className="board-wire-base"/><AnimatePresence>{active && value !== undefined && <motion.path d={path} className={`board-wire-signal signal-path-${value}`} initial={{pathLength:0,opacity:.25}} animate={{pathLength:1,opacity:1}} exit={{opacity:0}} transition={{duration:.48,ease:'easeInOut'}}/>}</AnimatePresence></g> })}
        </svg>
        {map.nodes.map((node) => {
          const style = { left: `${node.x / 10}%`, top: `${node.y / 5.2}%` }
          const owner = node.type === 'input' ? inputOwner(game,node.id) : null
          const inputValue = node.type === 'input' ? visibleInputValue(game,node.id,viewerId,revealAllInputs) : null
          const signalVisible = solution && nodeRevealed(node.id,node.type); const signal = signalVisible ? solution.signals[node.id] : undefined
          if (node.type === 'input') {
            const ownedValue = owner === viewerId ? game.players[owner]?.inputValues?.[node.id] : undefined
            return <div key={node.id} className="board-node input-node" style={style}><BoardInputCard id={node.id} value={inputValue ?? ownedValue} owner={owner} reveal={inputValue !== null || revealAllInputs} activeSignal={signal}/></div>
          }
          if (node.type === 'output') return <div key={node.id} className="board-node output-node" style={style}><OutputCard value={solution?.output} revealed={Boolean(signalVisible)}/>{signal !== undefined && <SignalDot value={signal}/>}</div>
          const placement = game.placements?.[node.id]; const legal = legalSlots.includes(node.id)
          return <button key={node.id} type="button" data-slot-id={node.id} className={`board-node card-slot ${node.type === 'wild' ? 'wild-slot' : ''} ${legal ? 'legal' : ''} ${placement ? 'filled' : ''}`} style={style} onClick={() => legal && onSlotClick(node.id)} disabled={!legal && !placement}>
            {!placement ? <div className="slot-print"><span>{node.type === 'wild' ? 'WILD' : 'GATE'}</span><strong>{node.id}</strong>{legal && <em>PLACE</em>}</div> : placement.kind === 'gate' ? <GateCard card={{id:placement.cardId,type:placement.cardType}} compact owner={placement.playerId} layoutId={`card-${placement.cardId}`}/> : <WildCard playerId={placement.playerId} side={placement.cardType} compact/>}
            {signal !== undefined && <SignalDot value={signal}/>}</button>
        })}
        <div className="board-fold vertical"/><div className="board-fold horizontal"/><span className="board-edition">LOGIC GATE DUEL · 2026</span>
      </div>
    </motion.section>
  )
}

export function PlayerHand({ player, playerId, isCurrent, selectedAction, wildSide, onSelectAction, onFlipWild, onDragAction, dealing, opponent = false }) {
  const cards = player.hand; const center = (cards.length - 1) / 2
  return <section className={`player-hand ${opponent ? 'opponent-hand' : 'current-hand'} ${isCurrent ? 'is-current' : ''}`}>
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`}/><strong>{PLAYER_META[playerId].name}</strong><small>{isCurrent ? 'TURN' : `${cards.length} CARDS`}</small></div>
    <div className="hand-fan">{cards.map((card,index) => { const selected = selectedAction?.kind === 'gate' && selectedAction.cardId === card.id; const rotate = opponent ? 0 : (index-center)*3.1; const translateY = opponent ? 0 : Math.abs(index-center)*2.5; return <motion.div key={card.id} className="hand-card-wrap" style={{zIndex:index+1}} animate={{rotate,y:translateY}} transition={{type:'spring',stiffness:420,damping:34}}><GateCard card={card} owner={playerId} selected={selected} disabled={!isCurrent || opponent} onSelect={() => onSelectAction?.(getActionForCard(card))} onDragEnd={(event) => onDragAction?.(getActionForCard(card),event)} dealFromCenter={dealing} dealDelay={(card.dealOrder||0)*.07}/></motion.div> })}
      {!player.wildUsed && <motion.div className="hand-card-wrap wild-in-hand" style={{zIndex:cards.length+2}}><WildCard playerId={playerId} side={wildSide} selected={selectedAction?.kind === 'wild'} disabled={!isCurrent || opponent} onSelect={() => onSelectAction?.(getWildAction(playerId,wildSide))} onFlip={onFlipWild} onDragEnd={(event) => onDragAction?.(getWildAction(playerId,wildSide),event)} dealFromCenter={dealing}/></motion.div>}
    </div>
  </section>
}

export function DeckStack({ count, dealing }) { return <div className={`deck-stack ${dealing ? 'is-dealing' : ''}`} aria-label={`덱 ${count}장`}><div className="deck-layer layer-3"><CardBack small/></div><div className="deck-layer layer-2"><CardBack small/></div><div className="deck-layer layer-1"><CardBack small/></div><span>{count}</span></div> }
export function TurnCurtain({ playerId, onReady }) { return <motion.div className="turn-curtain" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className={`turn-curtain-card player-${playerId+1}`} initial={{scale:.88,y:24}} animate={{scale:1,y:0}} exit={{scale:.92,y:-16}}><span>PASS THE DEVICE</span><strong>PLAYER {playerId+1}</strong><p>상대 INPUT 값이 보이지 않도록 화면을 넘겨주세요.</p><button type="button" onClick={onReady}>준비됨</button></motion.div></motion.div> }
export function CoinOverlay({ winnerId, onDone }) { const firstPlayerId=1-winnerId; return <motion.div className="coin-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className={`coin player-${winnerId+1}`} initial={{rotateY:0,y:-80,scale:.5}} animate={{rotateY:1080,y:0,scale:1}} transition={{duration:1.05,ease:[.2,.7,.2,1]}}>P{winnerId+1}</motion.div><motion.div className="coin-copy" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.72}}><span>COIN TOSS</span><strong>PLAYER {winnerId+1} 목표 선택</strong><small>PLAYER {firstPlayerId+1}가 먼저 카드를 놓습니다.</small><button type="button" onClick={onDone}>계속</button></motion.div></motion.div> }
export function TargetChoice({ playerId, onChoose }) { return <motion.div className="phase-panel" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><span className="eyebrow">TARGET SELECTION</span><h2>PLAYER {playerId+1}, 원하는 OUTPUT을 고르세요.</h2><p>선택한 값이 마지막 OUTPUT과 같으면 승리합니다. 상대는 자동으로 반대 값을 갖습니다.</p><div className="target-choice-grid">{[0,1].map((value)=><button key={value} className={`target-choice value-${value}`} onClick={()=>onChoose(value)}><span>MY TARGET</span><strong>{value}</strong></button>)}</div></motion.div> }
export function InputChoice({ game, playerId, draft, onChange, onSubmit }) { const assigned=game.players[playerId].assignedInputs; const complete=assigned.every((id)=>draft[id]!==undefined); return <motion.div className={`phase-panel input-phase player-panel-${playerId+1}`} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><span className="eyebrow">SECRET INPUT</span><h2>PLAYER {playerId+1}의 INPUT을 정하세요.</h2><p>이 값은 회로 실행 전까지 상대에게 공개되지 않습니다.</p><div className="input-choice-grid">{assigned.map((id)=><div key={id} className="input-choice-row"><strong>INPUT {id}</strong><div>{[0,1].map((value)=><button key={value} className={draft[id]===value?'active':''} onClick={()=>onChange(id,value)}>{value}</button>)}</div></div>)}</div><button className="primary-button" type="button" disabled={!complete} onClick={onSubmit}>INPUT 확정</button></motion.div> }
export function ResultOverlay({ game, map, onReplay, onMenu, onNewSeed }) { const winner=game.result?.winner??0; return <motion.div className="result-overlay" initial={{opacity:0}} animate={{opacity:1}}><motion.div className={`result-card player-${winner+1}`} initial={{y:45,scale:.9}} animate={{y:0,scale:1}} transition={{type:'spring',stiffness:230,damping:22}}><span className="eyebrow">CIRCUIT COMPLETE</span><div className="result-output"><span>OUTPUT</span><strong>{game.result?.output}</strong></div><h2>PLAYER {winner+1} WIN</h2><p>{map.code} · {map.name} · {game.moves.length} turns</p><div className="result-actions"><button onClick={onReplay}>같은 판 다시</button><button onClick={onNewSeed}>새 판</button><button onClick={onMenu}>맵 선택</button></div></motion.div></motion.div> }
