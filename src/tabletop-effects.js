// Small, dependency-free layer for tactile tabletop feedback.
// It never owns game state; it only reacts to the DOM that React already renders.

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
const seenFilled = new WeakSet()
let initialized = false

function pulseHaptic(ms = 8) {
  try {
    if (document.visibilityState === 'visible' && navigator.vibrate) navigator.vibrate(ms)
  } catch {}
}

function syncTurnState() {
  const status = document.querySelector('.focus-status')
  document.body.classList.toggle('tabletop-my-turn', Boolean(status?.classList.contains('is-my-turn')))
  document.body.classList.toggle('tabletop-opponent-turn', Boolean(status?.classList.contains('is-opponent-turn')))
}

function syncHoldingState() {
  const holding = document.querySelector('.logic-card.selected, .input-choice-card-slot.is-selected')
  document.body.classList.toggle('tabletop-holding', Boolean(holding))
}

function syncResultActions() {
  const actions = document.querySelector('.result-actions')
  if (!actions) return

  const buttons = [...actions.querySelectorAll('button')]
  const sameReplay = buttons.find((button) => button.textContent?.trim() === '같은 판 다시')
  if (sameReplay) sameReplay.remove()

  const newGame = [...actions.querySelectorAll('button')].find((button) => button.textContent?.trim() === '새 판')
  if (newGame) {
    newGame.textContent = '다시 하기'
    newGame.setAttribute('aria-label', '새로운 카드로 다시 하기')
  }
}

function primeExistingPlacements() {
  document.querySelectorAll('.card-slot.filled').forEach((slot) => seenFilled.add(slot))
}

function detectNewPlacements() {
  document.querySelectorAll('.card-slot.filled').forEach((slot) => {
    if (seenFilled.has(slot)) return
    seenFilled.add(slot)
    slot.classList.add('tabletop-landed')
    pulseHaptic(11)
    window.setTimeout(() => slot.classList.remove('tabletop-landed'), reduceMotion ? 40 : 620)
  })
}

function initTabletopEffects() {
  if (initialized) return
  initialized = true

  primeExistingPlacements()
  syncTurnState()
  syncHoldingState()
  syncResultActions()

  const observer = new MutationObserver(() => {
    syncTurnState()
    syncHoldingState()
    syncResultActions()
    detectNewPlacements()
  })
  observer.observe(document.getElementById('root') || document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  })

  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.logic-card:not(.compact), .input-choice-card')) {
      document.body.classList.add('tabletop-grabbing')
      pulseHaptic(4)
    }
  }, { passive: true })

  const release = () => document.body.classList.remove('tabletop-grabbing')
  document.addEventListener('pointerup', release, { passive: true })
  document.addEventListener('pointercancel', release, { passive: true })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    const target = event.target
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return
    const cancel = document.querySelector('.placement-hint button')
    if (cancel instanceof HTMLButtonElement) cancel.click()
  })
}

initTabletopEffects()