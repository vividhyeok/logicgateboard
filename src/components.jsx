import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PLAYER_META, getActionForCard, getWildAction, inputOwner, legalSlotIds, visibleInputValue } from './game.js'
import { MAP_BY_ID, wirePath } from './maps.js'
import { sound } from './audio.js'
import './input-board.css'
import './input-card-motion.css'
import './experience.css'
import './game-feel.css'

const CARD_META = {
  AND: { className: 'card-and', hint: '둘 다 1' },
  NAND: { className: 'card-nand', hint: 'AND 반전' },
  OR: { className: 'card-or', hint: '하나라도 1' },
  NOR: { className: 'card-nor', hint: 'OR 반전' },
  XOR: { className: 'card-xor', hint: '서로 다름' },
}
const GATE_TRUTH = {
  AND: '00→0 · 01→0 · 10→0 · 11→1',
  NAND: '00→1 · 01→1 · 10→1 · 11→0',
  OR: '00→0 · 01→1 · 10→1 · 11→1',
  NOR: '00→1 · 01→0 · 10→0 · 11→0',
  XOR: '00→0 · 01→1 · 10→1 · 11→0',
}

export function GateIcon({ type, className = '' }) {
  const bubble = type === 'NAND' || type === 'NOR'
  const base = type === 'XOR' ? 'OR' : type.replace('N', '')
  return (
    <svg className={`gate-icon ${className}`} viewBox="0 0 86 66" aria-hidden="true">
      {base === 'AND' && <path d="M14 9 H39 C58 9 69 20 69 33 C69 46 58 57 39 57 H14 Z" />}
      {base === 'OR' && <>
        <path d="M14 9 C29 17 30 49 14 57 C36 60 58 58 70 33 C58 8 36 6 14 9 Z" />
        {type === 'XOR' && <path d="M7 9 C22 20 23 46 7 57" />}
      </>}
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
  const CardTag = compact ? motion.div : motion.button
  const dragEnabled = !compact && !disabled && Boolean(onDragEnd)
  return (
    <CardTag
      type="button"
      layoutId={layoutId || `card-${card.id}`}
      className={`logic-card ${meta.className} ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      drag={dragEnabled}
      dragSnapToOrigin
      dragElastic={0.12}
      dragMomentum={false}
      whileDrag={{ scale: 1.09, rotate: 0, zIndex: 80, cursor: 'grabbing' }}
      onDragStart={() => { if (!selected) onSelect?.() }}
      onDragEnd={(event, info) => onDragEnd?.({ clientX: info?.point?.x ?? event?.clientX, clientY: info?.point?.y ?? event?.clientY, nativeEvent: event })}
      initial={dealFromCenter ? { y: -220, x: 0, scale: 0.28, rotate: 11, opacity: 0 } : false}
      animate={{ y: 0, x: 0, scale: 1, rotate: 0, opacity: 1 }}
      transition={dealFromCenter ? { type: 'spring', stiffness: 380, damping: 28, delay: dealDelay } : { type: 'spring', stiffness: 500, damping: 35 }}
      aria-label={`${card.type} 카드`}
      title={compact ? undefined : GATE_TRUTH[card.type]}
    >
      <span className="card-corner top">{card.type}</span>
      <div className="card-swoosh" />
      <div className="card-core"><GateIcon type={card.type} /><strong>{card.type}</strong>{!compact && <small>{meta.hint}</small>}</div>
      <span className="card-corner bottom">{card.type}</span>
      {owner !== null && owner >= 0 && <span className={`card-owner player-${owner + 1}`}>{owner + 1}</span>}
    </CardTag>
  )
}

export function WildCard({ playerId, side = 'NOT', compact = false, selected = false, disabled = false, onSelect, onFlip, onDragEnd, dealFromCenter = false, layoutId }) {
  const CardTag = compact ? motion.div : motion.button
  const dragEnabled = !compact && !disabled && Boolean(onDragEnd)
  const sideLabel = side === 'NOT' ? 'NOT' : '통과'
  return (
    <div className={`wild-wrap ${compact ? 'compact-wrap' : ''}`}>
      <CardTag
        type="button"
        layoutId={layoutId || `wild-p${playerId}`}
        className={`logic-card wild-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
        drag={dragEnabled}
        dragSnapToOrigin
        dragElastic={0.12}
        dragMomentum={false}
        whileDrag={{ scale: 1.09, rotate: 0, zIndex: 80, cursor: 'grabbing' }}
        onDragStart={() => { if (!selected) onSelect?.() }}
        onDragEnd={(event, info) => onDragEnd?.({ clientX: info?.point?.x ?? event?.clientX, clientY: info?.point?.y ?? event?.clientY, nativeEvent: event })}
        initial={dealFromCenter ? { y: -220, scale: 0.28, rotateY: 90, opacity: 0 } : false}
        animate={{ y: 0, scale: 1, rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, delay: dealFromCenter ? 0.58 : 0 }}
        aria-label={`와일드 ${sideLabel} 카드`}
      >
        <div className="wild-half wild-not" />
        <div className="wild-half wild-empty" />
        <span className="card-corner top">NOT / 통과</span>
        <div className="card-core wild-core">
          <motion.div key={side} initial={{ rotateY: 88, opacity: 0.25 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.24 }} className="wild-face">
            <strong>{sideLabel}</strong>{!compact && <small>{side === 'NOT' ? '이 경로 반전' : '반대 경로가 NOT'}</small>}
          </motion.div>
        </div>
        <span className="card-corner bottom">NOT / 통과</span>
        {playerId >= 0 && <span className={`card-owner player-${playerId + 1}`}>{playerId + 1}</span>}
      </CardTag>
      {!compact && !disabled && <button type="button" className="wild-flip-button" onClick={(event) => { event.stopPropagation(); onFlip?.() }}>↻ {side === 'NOT' ? '통과 쪽' : 'NOT 쪽'}</button>}
    </div>
  )
}

function SignalDot({ value }) {
  return <motion.span className={`signal-dot signal-${value}`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 460, damping: 24 }}>{value}</motion.span>
}

function inputCardLayoutId(id, value) {
  return value === undefined ? undefined : `input-card-${id}-${value}`
}

function BoardInputCard({ id, value, owner, reveal, activeSignal, layoutId, onClick }) {
  const shown = reveal ? value : null
  const interactive = Boolean(onClick)
  return (
    <motion.div
      layoutId={layoutId}
      layout={Boolean(layoutId)}
      className={`board-value-card input-value-card owner-${owner + 1} ${interactive ? 'input-card-interactive' : ''}`}
      animate={{ rotateY: shown === null ? 180 : 0 }}
      transition={layoutId ? { layout: { type: 'spring', stiffness: 520, damping: 34 }, rotateY: { duration: 0.22 } } : { duration: 0.3 }}
      aria-label={`입력 ${id}${shown !== null ? ` 값 ${shown}` : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.() } } : undefined}
    >
      <div className="value-card-inner">
        <div className="value-card-front"><span>{id}</span><strong>{shown ?? '?'}</strong></div>
        <div className="value-card-back"><span>{id}</span><strong>?</strong></div>
      </div>
      {activeSignal !== undefined && <SignalDot value={activeSignal} />}
    </motion.div>
  )
}

function InputChoiceCard({ inputId, value, order, onSelect, onDragStart, onDragEnd }) {
  return (
    <motion.button
      type="button"
      layoutId={inputCardLayoutId(inputId, value)}
      className="input-choice-card"
      data-input-id={inputId}
      onClick={onSelect}
      drag
      dragSnapToOrigin
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ x: -118, y: 28, scale: 0.34, opacity: 0, rotate: value === 0 ? -13 : 13 }}
      animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: value === 0 ? -2.5 : 2.5 }}
      whileHover={{ y: -8, scale: 1.055, rotate: 0 }}
      whileTap={{ scale: 0.96 }}
      whileDrag={{ scale: 1.08, rotate: 0, zIndex: 100, cursor: 'grabbing' }}
      transition={{ type: 'spring', stiffness: 420, damping: 30, delay: .11 + order * 0.085, layout: { type: 'spring', stiffness: 520, damping: 34 } }}
      aria-label={`${inputId} 입력 ${value} 카드 놓기`}
    >
      <strong>{value}</strong>
      <small>{inputId}에 놓기</small>
    </motion.button>
  )
}

function OutputCard({ value, revealed, activeSignal, gateType }) {
  return (
    <motion.div className="board-value-card output-value-card" animate={{ rotateY: revealed ? 0 : 180 }} transition={{ duration: 0.36 }} aria-label={`최종 결과${gateType ? ` · 고정 ${gateType}` : ''}`}>
      <div className="value-card-inner">
        <div className="value-card-front"><span style={{fontSize:10,fontWeight:800}}>{gateType ? `고정 ${gateType}` : 'OUT'}</span><strong>{revealed ? value : '?'}</strong></div>
        <div className="value-card-back"><span style={{fontSize:10,fontWeight:800}}>{gateType ? `고정 ${gateType}` : 'OUT'}</span><strong>?</strong></div>
      </div>
      {activeSignal !== undefined && <SignalDot value={activeSignal} />}
    </motion.div>
  )
}

export function MapPreview({ map }) {
  return <svg className="map-preview-svg" viewBox="0 0 1000 520" aria-hidden="true">
    {map.edges.map((edge) => <path key={edge.join('-')} d={wirePath(map, edge)} className="preview-wire" />)}
    {map.nodes.map((node) => {
      const isSlot = node.type === 'gate' || node.type === 'wild'
      return <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
        {isSlot ? <>
          <rect x="-33" y="-47" width="66" height="94" rx="8" className={node.type === 'wild' ? 'preview-slot wild' : 'preview-slot'} />
          <text x="0" y="4" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">{node.type === 'wild' ? '↔' : '＋'}</text>
        </> : <>
          <rect x="-24" y="-34" width="48" height="68" rx="7" className={node.type === 'output' ? 'preview-io output' : 'preview-io'} />
          {node.type === 'input' && <text x="0" y="4" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">{node.id}</text>}
          {node.type === 'output' && node.gateType && <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor">{node.gateType}</text>}
        </>}
      </g>
    })}
  </svg>
}

export function GameBoard({ map, game, viewerId, selectedAction, onSlotClick, revealAllInputs = false, solution = null, revealIndex = -1, resolving = false, inputSelection = null }) {
  const [focusedNode, setFocusedNode] = useState(null)
  const legalSlots = selectedAction ? legalSlotIds(game, selectedAction) : []
  const revealNodeIndex = solution?.revealOrder ? Object.fromEntries(solution.revealOrder.map((id, index) => [id, index])) : {}
  const nodeRevealed = (nodeId, type) => {
    if (!solution) return false
    if (type === 'input') return revealAllInputs
    const index = revealNodeIndex[nodeId]
    return index !== undefined && revealIndex >= index
  }

  return (
    <motion.section className="board-frame" initial={{ opacity: 0, scale: 0.94, rotateX: 9 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
      <div className={`board-canvas ${focusedNode ? 'has-node-focus' : ''} ${resolving ? 'is-resolving' : ''} ${inputSelection ? 'is-input-selecting' : ''}`} data-resolving={resolving ? 'true' : 'false'}>
        <svg className="board-wires" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="wireGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          {map.edges.map((edge) => {
            const [from, to] = edge
            const toNode = map.nodes.find((node) => node.id === to)
            const related = focusedNode && (from === focusedNode || to === focusedNode)
            const active = solution && toNode && nodeRevealed(to, toNode.type)
            const value = solution?.signals?.[from]
            const path = wirePath(map, edge)
            return <g key={edge.join('-')} data-from={from} data-to={to} className={`wire-group ${related ? 'is-related' : ''} ${active ? 'active' : ''}`}>
              <path d={path} className="board-wire-outline" />
              <path d={path} className="board-wire-base" />
              {active && value !== undefined && <motion.path key={`${from}-${to}-${revealIndex}`} d={path} className={`board-wire-signal signal-path-${value}`} initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.42, ease: 'easeInOut' }} />}
            </g>
          })}
        </svg>

        {map.nodes.map((node) => {
          const style = { left: `${node.x / 10}%`, top: `${node.y / 5.2}%` }
          const owner = node.type === 'input' ? inputOwner(game, node.id) : null
          const inputValue = node.type === 'input' ? visibleInputValue(game, node.id, viewerId, revealAllInputs) : null
          const signalVisible = nodeRevealed(node.id, node.type)
          const signal = signalVisible ? solution?.signals?.[node.id] : undefined
          const focusProps = {
            onPointerEnter: () => setFocusedNode(node.id),
            onPointerLeave: () => setFocusedNode(null),
            onFocus: () => setFocusedNode(node.id),
            onBlur: () => setFocusedNode(null),
          }

          if (node.type === 'input') {
            const ownedValue = owner === viewerId ? game.players[owner]?.inputValues?.[node.id] : undefined
            const canChooseHere = Boolean(inputSelection && owner === inputSelection.playerId && owner === viewerId)
            const draftValue = canChooseHere ? inputSelection.draft?.[node.id] : undefined
            const shownValue = canChooseHere ? draftValue : (inputValue ?? ownedValue)
            const revealValue = canChooseHere ? draftValue !== undefined : (inputValue !== null || revealAllInputs)
            return <div key={node.id} data-node-id={node.id} data-input-drop-id={canChooseHere ? node.id : undefined} className={`board-node input-node ${canChooseHere ? 'input-node-selectable' : ''} ${draftValue !== undefined ? 'input-node-chosen' : ''} ${inputSelection?.selected?.id === node.id ? 'input-drop-target' : ''} ${focusedNode === node.id ? 'is-focused' : ''}`} style={style} {...focusProps}>
              <BoardInputCard
                id={node.id}
                value={shownValue}
                owner={owner}
                reveal={revealValue}
                activeSignal={signal}
                layoutId={canChooseHere && draftValue !== undefined ? inputCardLayoutId(node.id, draftValue) : undefined}
                onClick={canChooseHere ? () => inputSelection.onPlace?.(node.id) : undefined}
              />
            </div>
          }

          if (node.type === 'output') {
            return <div key={node.id} data-node-id={node.id} className={`board-node output-node ${focusedNode === node.id ? 'is-focused' : ''}`} style={style} {...focusProps}>
              <OutputCard value={solution?.output} revealed={signalVisible} activeSignal={signal} gateType={node.gateType} />
            </div>
          }

          const placement = game.placements?.[node.id]
          const legal = legalSlots.includes(node.id)
          const isCurrentStage = true
          const pairedPreview = !placement && selectedAction?.kind === 'wild' && focusedNode && focusedNode !== node.id && legalSlots.includes(focusedNode) && legal
          const previewType = pairedPreview ? (selectedAction.side === 'NOT' ? '통과' : 'NOT') : null
          return <button key={node.id} type="button" data-slot-id={node.id} data-node-id={node.id} data-stage={node.stage ?? 1} className={`board-node card-slot ${node.type === 'wild' ? 'wild-slot' : ''} ${legal ? 'legal' : ''} ${placement ? 'filled' : ''} ${isCurrentStage ? 'current-stage-slot' : 'future-stage-slot'} ${focusedNode === node.id ? 'is-focused' : ''} ${signalVisible ? 'signal-resolved' : ''}`} style={style} onClick={() => legal && onSlotClick(node.id)} aria-label={`${node.id} ${node.type === 'wild' ? 'NOT 또는 통과 자리' : '게이트 자리'}${placement ? ` · ${placement.cardType === 'EMPTY' ? '통과' : placement.cardType}` : legal ? ' · 놓기 가능' : ''}`} aria-disabled={!legal} {...focusProps}>
            {!placement ? <>
              <div className="slot-print" aria-hidden="true" />
              <span className="slot-kind">{previewType ? `자동 ${previewType}` : node.type === 'wild' ? 'NOT / 통과' : '게이트'}</span>

            </> : placement.kind === 'gate' ? <GateCard card={{ id: placement.cardId, type: placement.cardType }} compact owner={placement.playerId} layoutId={`card-${placement.cardId}`} /> : <WildCard playerId={placement.playerId} side={placement.cardType} compact layoutId={placement.auto ? `wild-auto-${node.id}-${placement.turn}` : `wild-p${placement.playerId}`} />}
            {signal !== undefined && <SignalDot value={signal} />}
          </button>
        })}
      </div>
    </motion.section>
  )
}

export function PlayerHand({ game, player, playerId, label, isCurrent, selectedAction, wildSide, onSelectAction, onFlipWild, onDragAction, dealing, opponent = false }) {
  const [helpOn, setHelpOn] = useState(() => { try { return localStorage.getItem('logic-card-help') === 'on' } catch { return false } })
  const cards = player.hand
  const center = (cards.length - 1) / 2

  if (opponent) {
    const hiddenCount = cards.length + (player.wildUsed ? 0 : 1)
    return <section className={`player-hand opponent-hand ${isCurrent ? 'is-current' : ''}`}>
      <div className="hand-label"><span className={`player-pip player-${playerId + 1}`} /><strong>{label || '상대 카드'}</strong><small>{hiddenCount}장</small></div>
      <div className="hand-fan">{Array.from({ length: hiddenCount }, (_, index) => <motion.div key={`hidden-${index}`} className="hand-card-wrap" style={{ zIndex: index + 1 }} initial={dealing ? { y: -90, opacity: 0, rotate: index % 2 ? 2 : -2 } : false} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34, delay: dealing ? index * 0.04 : 0 }}><CardBack /></motion.div>)}</div>
    </section>
  }

  return <section className={`player-hand current-hand ${isCurrent ? 'is-current' : ''} ${dealing ? 'is-dealing' : ''}`}>
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`} /><strong>{label || PLAYER_META[playerId].name}</strong><small>{isCurrent ? '내 차례' : `${cards.length}장`}</small></div>
    <label className="card-help-toggle"><input type="checkbox" checked={helpOn} onChange={event => { setHelpOn(event.target.checked); try { localStorage.setItem('logic-card-help', event.target.checked ? 'on' : 'off') } catch {} }} />카드 도움말</label>
    {helpOn && <div className="selected-card-help" aria-live="polite">{selectedAction?.kind === 'gate' ? <><b>{selectedAction.cardType}</b><span>{GATE_TRUTH[selectedAction.cardType]}</span></> : selectedAction?.kind === 'wild' ? <><b>NOT · 0↔1 / 통과 · 그대로</b><span>한쪽을 놓으면 반대쪽은 자동으로 정해집니다. 턴을 넘기는 카드가 아닙니다.</span></> : '카드를 선택하면 입력별 결과를 볼 수 있습니다. 덱은 AND·NAND·OR·NOR·XOR 각 4장입니다.'}</div>}
    {dealing && <motion.div className="hand-deal-deck" initial={{ opacity: 0, y: 12, scale: .82 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .92 }}><DeckStack count={game?.deck?.length ?? 0} dealing /></motion.div>}
    <div className="hand-fan">
      {cards.map((card, index) => {
        const selected = selectedAction?.kind === 'gate' && selectedAction.cardId === card.id
        const rotate = (index - center) * 3.1
        const translateY = Math.abs(index - center) * 2.5
        return <motion.div key={card.id} className="hand-card-wrap" style={{ zIndex: index + 1 }} animate={{ rotate, y: translateY }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}><GateCard card={card} owner={playerId} selected={selected} disabled={!isCurrent || (game && !legalSlotIds(game, getActionForCard(card), playerId).length)} onSelect={() => onSelectAction?.(getActionForCard(card))} onDragEnd={(event) => onDragAction?.(getActionForCard(card), event)} dealFromCenter={dealing} dealDelay={(card.dealOrder || 0) * 0.07} /></motion.div>
      })}
      {!player.wildUsed && <motion.div className="hand-card-wrap wild-in-hand" style={{ zIndex: cards.length + 2 }}><WildCard playerId={playerId} side={wildSide} selected={selectedAction?.kind === 'wild'} disabled={!isCurrent} onSelect={() => onSelectAction?.(getWildAction(playerId, wildSide))} onFlip={onFlipWild} onDragEnd={(event) => onDragAction?.(getWildAction(playerId, wildSide), event)} dealFromCenter={dealing} /></motion.div>}
    </div>
  </section>
}

export function DeckStack({ count, dealing }) {
  return <div className={`deck-stack ${dealing ? 'is-dealing' : ''}`} aria-label={`덱 ${count}장`}><div className="deck-layer layer-3"><CardBack small /></div><div className="deck-layer layer-2"><CardBack small /></div><div className="deck-layer layer-1"><CardBack small /></div><span>{count}</span></div>
}

export function TurnCurtain({ playerId, onReady }) {
  return <motion.div className="turn-curtain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className={`turn-curtain-card player-${playerId + 1}`} initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: -16 }}><span>기기 넘기기</span><strong>플레이어 {playerId + 1}</strong><p>상대가 보지 않도록 화면을 넘겨주세요.</p><button type="button" onClick={onReady}>준비됨</button></motion.div></motion.div>
}

export function CoinOverlay({ winnerId, viewerId = null, onDone }) {
  const firstPlayerId = 1 - winnerId
  const name = (id) => viewerId === null ? `플레이어 ${id + 1}` : (id === viewerId ? '당신' : '상대')
  return <motion.div className="coin-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className={`coin player-${winnerId + 1}`} initial={{ rotateY: 0, y: -80, scale: 0.5 }} animate={{ rotateY: 1080, y: 0, scale: 1 }} transition={{ duration: 1.05, ease: [0.2, 0.7, 0.2, 1] }}>{viewerId === null ? winnerId + 1 : (winnerId === viewerId ? '나' : '상대')}</motion.div><motion.div className="coin-copy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}><span>순서 정하기</span><strong>{name(winnerId)}이 목표를 고릅니다.</strong><small>{name(firstPlayerId)}이 먼저 카드를 놓습니다.</small><button type="button" onClick={onDone}>확인</button></motion.div></motion.div>
}

export function TargetChoice({ playerId, personal = false, onChoose }) {
  return <motion.div className="phase-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}><span className="eyebrow">목표 선택</span><h2>{personal ? '원하는 결과를 고르세요.' : `플레이어 ${playerId + 1}, 원하는 결과를 고르세요.`}</h2><div className="target-choice-grid">{[0, 1].map((value) => <button key={value} className={`target-choice value-${value}`} onClick={() => onChoose(value)}><span>내 목표</span><strong>{value}</strong></button>)}</div></motion.div>
}

export function InputChoice({ game, playerId, personal = false, draft, onChange, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const assigned = game.players[playerId].assignedInputs
  const opponentAssigned = game.players[1 - playerId].assignedInputs
  const complete = assigned.every((id) => draft[id] !== undefined)
  const map = MAP_BY_ID[game.mapId]

  useEffect(() => {
    const timers = []
    assigned.forEach((id, pairIndex) => {
      ;[0, 1].forEach((value) => {
        timers.push(window.setTimeout(() => sound('deal'), 120 + (pairIndex * 2 + value) * 90))
      })
    })
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [game.seed, playerId])

  function placeSelected(id) {
    if (selected?.id === id) {
      onChange(id, selected.value)
      setSelected(null)
    } else if (draft[id] !== undefined) {
      onChange(id, undefined)
      setSelected(null)
    }
  }

  function dropInputCard(inputId, value, event, info) {
    const x = info?.point?.x ?? event?.clientX
    const y = info?.point?.y ?? event?.clientY
    if (x === undefined || y === undefined) return
    const target = document.elementsFromPoint(x, y).find((element) => element?.dataset?.inputDropId === inputId)
    if (target) {
      onChange(inputId, value)
      setSelected(null)
      sound('place')
    }
  }

  return <motion.div className={`phase-panel input-phase input-board-phase player-panel-${playerId + 1}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
    <div className="input-board-heading">
      <div><span className="eyebrow">비밀 입력</span><h2>{personal ? '0·1 카드를 내 자리에 놓으세요.' : `플레이어 ${playerId + 1}, 입력 카드를 보드에 놓으세요.`}</h2></div>
      <div className="input-privacy-copy"><strong>내 위치 · {assigned.join(' · ')}</strong><span>상대 위치 · {opponentAssigned.join(' · ')}</span><small>위치는 서로 보이지만, 놓은 카드의 0/1 값은 상대에게 공개되지 않습니다.</small></div>
    </div>
    <div className="input-board-live">
      <GameBoard map={map} game={game} viewerId={playerId} selectedAction={null} onSlotClick={() => {}} inputSelection={{ playerId, draft, selected, onPlace: placeSelected }} />
    </div>
    <div className="input-deal-zone">
      <motion.div className="input-setup-deck" initial={{ opacity: 0, scale: .88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .04 }}><DeckStack count={assigned.length * 2} dealing /><small>입력 카드</small></motion.div>
      <div className="input-card-rack" aria-label="비밀 입력 카드">
        {assigned.map((id, pairIndex) => {
          const placedValue = draft[id]
          return <div className="input-card-pair" key={id}>
            <div className="input-card-pair-label"><b>{id}</b><span>{placedValue === undefined ? '내 자리' : `${placedValue} 놓음`}</span></div>
            <div className="input-card-pair-cards">
              {[0, 1].map((value) => <div className={`input-choice-card-slot ${selected?.id === id && selected.value === value ? 'is-selected' : ''}`} key={value}>
                {placedValue === value
                  ? <div className="input-choice-card-placeholder" aria-hidden="true" />
                  : <InputChoiceCard
                      inputId={id}
                      value={value}
                      order={pairIndex * 2 + value}
                      onSelect={() => setSelected(current => current?.id === id && current.value === value ? null : { id, value })}
                      onDragStart={() => setSelected({ id, value })}
                      onDragEnd={(event, info) => dropInputCard(id, value, event, info)}
                    />}
              </div>)}
            </div>
          </div>
        })}
      </div>
    </div>
    <div className="input-board-footer">
      <span>{selected ? `${selected.value} 카드 선택 · ${selected.id} 자리로 드래그하거나 자리를 누르세요.` : complete ? '모두 놓았습니다. 내 입력 카드를 누르면 다시 가져올 수 있습니다.' : '0/1 카드를 드래그하거나 눌러 내 자리에 놓으세요.'}</span>
      <motion.button className="primary-button" type="button" disabled={!complete || Boolean(selected)} onClick={onSubmit} animate={complete ? { scale: [1, 1.025, 1] } : { scale: 1 }} transition={{ duration: .34 }}>입력 확정</motion.button>
    </div>
  </motion.div>
}

export function ResultOverlay({ game, onReplay, onMenu, onNewSeed }) {
  const [inspect, setInspect] = useState(false)
  const won = (game.result?.winner ?? 0) === 0
  if (inspect) return <button className="show-result-button" onClick={() => setInspect(false)}>결과 다시 보기</button>
  return <motion.div className="result-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className={`result-card player-${won ? 1 : 2}`} initial={{ y: 45, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 230, damping: 22 }}><div className="result-output"><span>결과</span><strong>{game.result?.output}</strong></div><h2>{won ? '승리했습니다!' : '상대가 이겼습니다'}</h2><div className="result-actions"><button onClick={() => setInspect(true)}>보드 살펴보기</button><button onClick={onReplay}>같은 판 다시</button><button onClick={onNewSeed}>새 판</button><button onClick={onMenu}>맵 선택</button></div></motion.div></motion.div>
}
