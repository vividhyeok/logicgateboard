import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CardBack, DeckStack } from './components.jsx'
import { sound } from './audio.js'
import './setup-hand.css'

function SetupValueCard({ inputId, value, order, selected, onSelect, onDragStart, onDrop }) {
  return <motion.button
    type="button"
    className={`input-choice-card setup-value-card ${selected ? 'setup-selected' : ''}`}
    data-input-id={inputId}
    onClick={onSelect}
    drag
    dragSnapToOrigin
    dragElastic={0.08}
    dragMomentum={false}
    onDragStart={onDragStart}
    onDragEnd={(event, info) => onDrop?.(event, info)}
    initial={{ x: -108, y: 24, scale: .34, opacity: 0, rotate: value === 0 ? -11 : 11 }}
    animate={{ x: 0, y: selected ? -8 : 0, scale: selected ? 1.06 : 1, opacity: 1, rotate: selected ? 0 : value === 0 ? -2.5 : 2.5 }}
    whileHover={{ y: -8, scale: 1.055, rotate: 0 }}
    whileTap={{ scale: .96 }}
    whileDrag={{ scale: 1.08, rotate: 0, zIndex: 100, cursor: 'grabbing' }}
    transition={{ type: 'spring', stiffness: 420, damping: 30, delay: .08 + order * .085 }}
    aria-label={`${inputId} 입력 ${value} 카드`}
  ><strong>{value}</strong><small>{inputId}</small></motion.button>
}

export function SetupOpponentHand({ game, playerId, active = false }) {
  const count = Math.max(2, (game.players[playerId]?.assignedInputs?.length || 1) * 2)
  return <section className={`player-hand opponent-hand setup-opponent-hand ${active ? 'is-current' : ''}`}>
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`} /><strong>상대 입력 카드</strong><small>{count}장</small></div>
    <div className="hand-fan">{Array.from({ length: count }, (_, index) => <motion.div key={index} className="hand-card-wrap" style={{ zIndex: index + 1 }} initial={{ y: -46, opacity: 0, rotate: index % 2 ? 2 : -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34, delay: index * .045 }}><CardBack /></motion.div>)}</div>
  </section>
}

export function SetupHand({ game, playerId, draft, selected, onSelect, onPlace, onSubmit, personal = false }) {
  const assigned = game.players[playerId].assignedInputs
  const complete = assigned.every((id) => draft[id] !== undefined)

  useEffect(() => {
    const timers = []
    assigned.forEach((id, pairIndex) => {
      ;[0, 1].forEach((value) => timers.push(window.setTimeout(() => sound('deal'), 100 + (pairIndex * 2 + value) * 85)))
    })
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [game.seed, playerId])

  function dropCard(inputId, value, event, info) {
    const x = info?.point?.x ?? event?.clientX
    const y = info?.point?.y ?? event?.clientY
    if (x === undefined || y === undefined) return
    const target = document.elementsFromPoint(x, y).find((element) => element?.dataset?.inputDropId === inputId)
    if (!target) return
    onPlace(inputId, value)
    sound('place')
  }

  return <section className="player-hand current-hand setup-hand is-current">
    <div className="hand-label"><span className={`player-pip player-${playerId + 1}`} /><strong>{personal ? '내 입력 카드' : `플레이어 ${playerId + 1} 입력 카드`}</strong><small>{complete ? '배치 완료' : '0 / 1 선택'}</small></div>
    <div className="setup-hand-stage">
      <div className="setup-mini-deck"><DeckStack count={assigned.length * 2} dealing /><span>INPUT</span></div>
      <div className="setup-pairs">
        {assigned.map((id, pairIndex) => {
          const placedValue = draft[id]
          return <div className="setup-pair" key={id}>
            <b>{id}</b>
            <div className="setup-pair-cards">{[0, 1].map((value) => <div className="setup-card-slot" key={value}>
              {placedValue === value
                ? <div className="setup-card-placeholder"><span>{value}</span><small>보드에 놓음</small></div>
                : <SetupValueCard inputId={id} value={value} order={pairIndex * 2 + value} selected={selected?.id === id && selected.value === value} onSelect={() => onSelect(selected?.id === id && selected.value === value ? null : { id, value })} onDragStart={() => onSelect({ id, value })} onDrop={(event, info) => dropCard(id, value, event, info)} />}
            </div>)}</div>
          </div>
        })}
      </div>
      <div className="setup-confirm">
        <span>{selected ? `${selected.value} 카드를 ${selected.id}에 놓으세요` : complete ? '입력 카드 배치 완료' : '카드를 드래그하거나 선택 후 보드에 놓으세요'}</span>
        <motion.button type="button" className="primary-button" disabled={!complete || Boolean(selected)} onClick={onSubmit} animate={complete && !selected ? { scale: [1, 1.025, 1] } : { scale: 1 }} transition={{ duration: .34 }}>입력 확정</motion.button>
      </div>
    </div>
  </section>
}
