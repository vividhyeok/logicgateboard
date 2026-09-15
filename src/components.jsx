import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
  return <div className={`card-back ${small ? 'small' : ''}`}><div className="card-back-ring"><span>◆</span></div></div>
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
      <span className="card-corner bottom">{card.type}</span>{owner !== null && <span className={`card-owner player-${owner + 1}`}>{owner + 1}</span>}
    </motion.button>
  )
}

export function WildCard({ playerId, side = 'NOT', compact = false, selected = false, disabled = false, onSelect, onFlip, onDragEnd, dealFromCenter = false }) {
  const dragEnabled = !compact && !disabled && Boolean(onDragEnd)
  const sideLabel = side === 'NOT' ? 'NOT' : '통과'
  return (
    <div className={`wild-wrap ${compact ? 'compact-wrap' : ''}`}>
      <motion.button type="button" layoutId={`wild-p${playerId}`} className={`logic-card wild-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
        onClick={disabled ? undefined : onSelect} disabled={disabled} drag={dragEnabled} dragSnapToOrigin dragElastic={0.12} dragMomentum={false}
        whileDrag={{ scale: 1.09, rotate: 0, zIndex: 80, cursor: 'grabbing' }} onDragEnd={onDragEnd}
        initial={dealFromCenter ? { y: playerId === 0 ? -330 : 330, scale: 0.4, rotateY: 90, opacity: 0 } : false}
        animate={{ y: 0, scale: 1, rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: dealFromCenter ? 0.58 : 0 }} aria-label={`와일드 ${sideLabel} 카드`}>
        <div className="wild-half wild-not" /><div className="wild-half wild-empty" /><span className="card-corner top">WILD</span>
        <div className="card-core wild-core"><motion.div key={side} initial={{ rotateY: 88, opacity: 0.25 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.24 }} className="wild-face"><strong>{sideLabel}</strong>{!compact && <small>{side === 'NOT' ? '신호 반전' : '그대로 통과'}</small>}</motion.div></div>
        <span className="card-corner bottom">WILD</span><span className={`card-owner player-${playerId + 1}`}>{playerId + 1}</span>
      </motion.button>
      {!compact && !disabled && <button type="button" className="wild-flip-button" onClick={(event) => { event.stopPropagation(); onFlip?.() }}>↻ {side === 'NOT' ? '통과' : '반전'}</button>}
    </div>
  )
}

function BoardInputCard({ id, value, owner, reveal }) {
  const shown = reveal ? value : null
  return <motion.div className={`board-value-card input-value-card owner-${owner + 1}`} animate={{ rotateY: shown === null ? 180 : 0 }} transition={{ duration: 0.3 }} aria-label={`입력 ${id}`}>
    <div className="value-card-inner"><div className="value-card-front"><span>{id}</span><strong>{shown ?? '?'}</strong></div><div className="value-card-back"><span>{id}</span><strong>?</strong></div></div>
  </motion.div>
}
function OutputCard({ value, revealed }) {
  return <motion.div className="board-value-card output-value-card" animate={{ rotateY: revealed ? 0 : 180 }} transition={{ duration: 0.36 }} aria-label="최종 결과"><div className="value-card-inner"><div className="value-card-front"><strong>{revealed ? value : '?'}</strong></div><div className="value-card-back"><strong>?</strong></div></div></motion.div>
}

export function MapPreview({ map }) {
  return <svg className="map-preview-svg" viewBox="0 0 1000 520" aria-hidden="true">
    {map.edges.map((edge) => <path key={edge.join('-')} d={wirePath(map, edge)} className="preview-wire" />)}
    {map.nodes.map((node) => { const isSlot = node.type === 'gate' || node.type === 'wild'; return <g key={node.id} transform={`translate(${node.x} ${node.y})`}>{isSlot ? <rect x="-33" y="-47" width="66" height="94" rx="8" className={node.type === 'wild' ? 'preview-slot wild' : 'preview-slot'} /> : <rect x="-24" y="-34" width="48" height="68" rx="7" className={node.type === 'output' ? 'preview-io output' : 'preview-io'} />}</g> })}
  </svg>
}

export function GameBoard({ map, game, viewerId, selectedAction, onSlotClick, revealAllInputs = false, solution = null, resolving = false }) {
  const [focusedNode, setFocusedNode] = useState(null)
  const legalSlots = selectedAction ? legalSlotIds(game, selectedAction) : []
  const outputRevealed = solution?.output !== undefined
  return (
    <motion.section className="board-frame" initial={{ opacity: 0, scale: 0.94, rotateX: 9 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
      <div className={`board-canvas ${focusedNode ? 'has-node-focus' : ''}`} data-resolving={resolving ? 'true' : 'false'}>
        <svg className="board-wires" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          {map.edges.map((edge) => { const [from,to] = edge; const related = focusedNode && (from === focusedNode || to === focusedNode); const path = wirePath(map,edge); return <g key={edge.join('-')} data-from={from} data-to={to} className={`wire-group ${related ? 'is-related' : ''}`}><path d={path} className="board-wire-outline"/><path d={path} className="board-wire-base"/></g> })}
        </svg>
        {map.nodes.map((node) => {
          const style = { left: `${node.x / 10}%`, top: `${node.y / 5.2}%` }
          const owner = node.type === 'input' ? inputOwner(game,node.id) : null
          const inputValue = node.type === 'input' ? visibleInputValue(game,node.id,viewerId,revealAllInputs) : null
          const focusProps = { onPointerEnter: () => setFocusedNode(node.id), onPointerLeave: () => setFocusedNode(null), onFocus: () => setFocusedNode(node.id), onBlur: () => setFocusedNode(null) }
          if (node.type === 'input') {
            const ownedValue = owner === viewerId ? game.players[owner]?.inputValues?.[node.id] : undefined
            return <div key={node.id} data-node-id={node.id} className={`board-node input-node ${focusedNode === node.id ? 'is-focused' : ''}`} style={style} {...focusProps}><BoardInputCard id={node.id} value={inputValue ?? ownedValue} owner={owner} reveal={inputValue !== null || revealAllInputs}/></div>
          }
          if (node.type === 'output') return <div key={node.id} data-node-id={node.id} className={`board-node output-node ${focusedNode === node.id ? 'is-focused' : ''}`} style={style} {...focusProps}><OutputCard value={solution?.output} revealed={outputRevealed}/></div>
          const placement = game.placements?.[node.id]; const legal = legalSlots.includes(node.id)
          return <button key={node.id} type="button" data-slot-id={node.id} data-node-id={node.id} className={`board-node card-slot ${node.type === 'wild' ? 'wild-slot' : ''} ${legal ? 'legal' : ''} ${placement ? 'filled' : ''} ${focusedNode === node.id ? 'is-focused' : ''}`} style={style} onClick={() => legal && onSlotClick(node.id)} disabled={!legal && !placement} {...focusProps}>
            {!placement ? <div className="slot-print" aria-hidden="true"/> : placement.kind === 'gate' ? <GateCard card={{id:placement.cardId,type:placement.cardType}} compact owner={placement.playerId} layoutId={`card-${placement.cardId}`}/> : <WildCard playerId={placement.playerId} side={placement.cardType} compact/>}
          </button>
        })}
      </div>
    </motion.section>
  )
}

export function PlayerHand({ player, playerId, label, isCurrent, selectedAction, wildSide, onSelectAction, onFlipWild, onDragAction, dealing, opponent = false }) {
  const cards = player.hand; const center = (cards.length - 1) / 2
  if (opponent) {
    const hiddenCount = cards.length + (player.wildUsed ? 0 : 1)
    return <section className={`player-hand opponent-hand ${isCurrent ? 'is-current' : ''}`}>
      <div className="hand-label"><span className={`player-pip player-${playerId + 1}`}/><strong>{label||'상대 카드'}</strong><small>{hiddenCount}장</small></div>
      <div className="hand-fan">{Array.from({length:hiddenCount},(_,index)=><motion.div key={`hidden-${index}`} className="hand-card-wrap" style={{zIndex:index+1}} initial={dealing?{y:-90,opacity:0,rotate:index%2?2:-2}:false} animate={{y:0,opacity:1,rotate:0}} transition={{type:'spring',stiffness:420,damping:34,delay:dealing?index*.04:0}}><CardBack/></motion.div>)}</div>
    </section>
  }
  return <section className={`player-hand current-hand ${isCurrent ? 'is-current' : ''}`}>
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`}/><strong>{label||PLAYER_META[playerId].name}</strong><small>{isCurrent ? '내 차례' : `${cards.length}장`}</small></div>
    <div className="hand-fan">{cards.map((card,index) => { const selected = selectedAction?.kind === 'gate' && selectedAction.cardId === card.id; const rotate = (index-center)*3.1; const translateY = Math.abs(index-center)*2.5; return <motion.div key={card.id} className="hand-card-wrap" style={{zIndex:index+1}} animate={{rotate,y:translateY}} transition={{type:'spring',stiffness:420,damping:34}}><GateCard card={card} owner={playerId} selected={selected} disabled={!isCurrent} onSelect={() => onSelectAction?.(getActionForCard(card))} onDragEnd={(event) => onDragAction?.(getActionForCard(card),event)} dealFromCenter={dealing} dealDelay={(card.dealOrder||0)*.07}/></motion.div> })}
      {!player.wildUsed && <motion.div className="hand-card-wrap wild-in-hand" style={{zIndex:cards.length+2}}><WildCard playerId={playerId} side={wildSide} selected={selectedAction?.kind === 'wild'} disabled={!isCurrent} onSelect={() => onSelectAction?.(getWildAction(playerId,wildSide))} onFlip={onFlipWild} onDragEnd={(event) => onDragAction?.(getWildAction(playerId,wildSide),event)} dealFromCenter={dealing}/></motion.div>}
    </div>
  </section>
}

export function DeckStack({ count, dealing }) { return <div className={`deck-stack ${dealing ? 'is-dealing' : ''}`} aria-label={`덱 ${count}장`}><div className="deck-layer layer-3"><CardBack small/></div><div className="deck-layer layer-2"><CardBack small/></div><div className="deck-layer layer-1"><CardBack small/></div><span>{count}</span></div> }
export function TurnCurtain({ playerId, onReady }) { return <motion.div className="turn-curtain" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className={`turn-curtain-card player-${playerId+1}`} initial={{scale:.88,y:24}} animate={{scale:1,y:0}} exit={{scale:.92,y:-16}}><span>기기 넘기기</span><strong>플레이어 {playerId+1}</strong><p>상대가 보지 않도록 화면을 넘겨주세요.</p><button type="button" onClick={onReady}>준비됨</button></motion.div></motion.div> }
export function CoinOverlay({ winnerId, viewerId=null, onDone }) { const firstPlayerId=1-winnerId; const name=(id)=>viewerId===null?`플레이어 ${id+1}`:(id===viewerId?'당신':'상대'); return <motion.div className="coin-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className={`coin player-${winnerId+1}`} initial={{rotateY:0,y:-80,scale:.5}} animate={{rotateY:1080,y:0,scale:1}} transition={{duration:1.05,ease:[.2,.7,.2,1]}}>{viewerId===null?winnerId+1:(winnerId===viewerId?'나':'상대')}</motion.div><motion.div className="coin-copy" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.72}}><span>순서 정하기</span><strong>{name(winnerId)}이 목표를 고릅니다.</strong><small>{name(firstPlayerId)}이 먼저 카드를 놓습니다.</small><button type="button" onClick={onDone}>확인</button></motion.div></motion.div> }
export function TargetChoice({ playerId, personal=false, onChoose }) { return <motion.div className="phase-panel" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><span className="eyebrow">목표 선택</span><h2>{personal?'원하는 결과를 고르세요.':`플레이어 ${playerId+1}, 원하는 결과를 고르세요.`}</h2><div className="target-choice-grid">{[0,1].map((value)=><button key={value} className={`target-choice value-${value}`} onClick={()=>onChoose(value)}><span>내 목표</span><strong>{value}</strong></button>)}</div></motion.div> }
export function InputChoice({ game, playerId, personal=false, draft, onChange, onSubmit }) { const assigned=game.players[playerId].assignedInputs; const complete=assigned.every((id)=>draft[id]!==undefined); return <motion.div className={`phase-panel input-phase player-panel-${playerId+1}`} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><span className="eyebrow">비밀 입력</span><h2>{personal?'내 입력을 정하세요.':`플레이어 ${playerId+1}의 입력을 정하세요.`}</h2><div className="input-choice-grid">{assigned.map((id)=><div key={id} className="input-choice-row"><strong>{id}</strong><div>{[0,1].map((value)=><button key={value} className={draft[id]===value?'active':''} onClick={()=>onChange(id,value)}>{value}</button>)}</div></div>)}</div><button className="primary-button" type="button" disabled={!complete} onClick={onSubmit}>확정</button></motion.div> }
export function ResultOverlay({ game, onReplay, onMenu, onNewSeed }) { const won=(game.result?.winner??0)===0; return <motion.div className="result-overlay" initial={{opacity:0}} animate={{opacity:1}}><motion.div className={`result-card player-${won?1:2}`} initial={{y:45,scale:.9}} animate={{y:0,scale:1}} transition={{type:'spring',stiffness:230,damping:22}}><div className="result-output"><span>결과</span><strong>{game.result?.output}</strong></div><h2>{won?'승리했습니다!':'상대가 이겼습니다'}</h2><div className="result-actions"><button onClick={onReplay}>같은 판 다시</button><button onClick={onNewSeed}>새 판</button><button onClick={onMenu}>맵 선택</button></div></motion.div></motion.div> }
