import { MAP_BY_ID } from './maps.js'

export const GATE_TYPES = ['AND', 'NAND', 'OR', 'NOR', 'XOR']
export const GATE_COPIES = { AND: 4, NAND: 4, OR: 4, NOR: 4, XOR: 4 }
export const HAND_SIZE = { 1: 4, 2: 5 }
export const RULES_VERSION = 'post-input-gate-deal-v3'
export const PLAYER_META = [
  { id: 0, name: 'PLAYER 1', short: 'P1', className: 'player-one' },
  { id: 1, name: 'PLAYER 2', short: 'P2', className: 'player-two' },
]

export function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(items, random) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}
function clone(value) { return structuredClone(value) }
function buildDeck() {
  let serial = 0
  return GATE_TYPES.flatMap((type) => Array.from({ length: GATE_COPIES[type] }, () => ({ id: `${type.toLowerCase()}-${serial++}`, type })))
}
function blankPlayer(id) { return { id, assignedInputs: [], inputValues: {}, inputsLocked: false, target: null, hand: [], initialHand: [], wildUsed: false } }

export function stageNumbers(map) {
  return [...new Set(map.nodes.filter((node) => node.type === 'gate' || node.type === 'wild').map((node) => node.stage ?? 1))].sort((a, b) => a - b)
}
export function currentStage(game) {
  const map = MAP_BY_ID[game.mapId]
  return game.stage ?? stageNumbers(map)[0] ?? 1
}
function allSlotsComplete(game) {
  return slotIds(MAP_BY_ID[game.mapId]).every((id) => Boolean(game.placements?.[id]))
}
function pairedWildNode(map, node) {
  if (!node?.pair) return null
  return map.nodes.find((candidate) => candidate.type === 'wild' && candidate.id !== node.id && candidate.pair === node.pair) || null
}
function wildPairResolved(game, node) {
  if (!node?.pair) return Boolean(game.placements?.[node?.id])
  const map = MAP_BY_ID[game.mapId]
  return map.nodes.filter((candidate) => candidate.type === 'wild' && candidate.pair === node.pair).some((candidate) => Boolean(game.placements?.[candidate.id]))
}

export function createGame(mapId, mode = 'local', seed = Math.floor(Math.random() * 2147483647)) {
  const map = MAP_BY_ID[mapId]
  const random = seededRandom(seed)
  const players = [blankPlayer(0), blankPlayer(1)]
  const groups = map.inputGroups || [
    map.nodes.filter((node) => node.type === 'input').map((node) => node.id).filter((_, index) => index % 2 === 0),
    map.nodes.filter((node) => node.type === 'input').map((node) => node.id).filter((_, index) => index % 2 === 1),
  ]
  const layoutFlip = random() < 0.5 ? 0 : 1
  players[0].assignedInputs = [...(groups[layoutFlip] || [])].sort()
  players[1].assignedInputs = [...(groups[1 - layoutFlip] || [])].sort()
  const coinWinner = random() < 0.5 ? 0 : 1
  return {
    seed, mode, mapId, phase: 'target_choice', players, deck: [], placements: {}, moves: [], turnNumber: 0,
    coinWinner, targetChooser: coinWinner, firstPlayer: 1 - coinWinner, currentPlayer: 1 - coinWinner,
    stage: stageNumbers(map)[0] ?? 1, stageStarter: 1 - coinWinner, inputLayout: players.map((player) => [...player.assignedInputs]),
    startedAt: Date.now(), result: null, rulesVersion: RULES_VERSION,
  }
}

export function chooseTarget(game, playerId, target) {
  if (![0, 1].includes(target) || game.phase !== 'target_choice' || game.targetChooser !== playerId) return game
  const next = clone(game)
  next.players[playerId].target = target
  next.players[1 - playerId].target = 1 - target
  next.phase = 'input_selection'
  return next
}
export function nextInputPlayer(game) {
  for (const player of game.players) {
    const locked = player.inputsLocked ?? Object.keys(player.inputValues).length > 0
    if (!locked) return player.id
  }
  return null
}
export function randomInputsForPlayer(game, playerId) {
  const random = seededRandom((game.seed ^ ((playerId + 11) * 0x85ebca6b)) >>> 0)
  return Object.fromEntries(game.players[playerId].assignedInputs.map((id) => [id, random() < 0.5 ? 0 : 1]))
}
export function setPlayerInputs(game, playerId, values) {
  if (game.phase !== 'input_selection') return game
  const player = game.players[playerId]
  if (!player) return game
  const alreadyLocked = player.inputsLocked ?? Object.keys(player.inputValues).length > 0
  if (!player || alreadyLocked || !values || Object.keys(values).length !== player.assignedInputs.length || player.assignedInputs.some((id) => ![0, 1].includes(values[id]))) return game
  const next = clone(game)
  next.players[playerId].inputValues = { ...values }
  next.players[playerId].inputsLocked = true
  const ready = next.players.every((item) => item.inputsLocked ?? Object.keys(item.inputValues).length === item.assignedInputs.length)
  if (!ready) return next

  // Gate cards do not exist in either player's hand during input setup.
  // Once both players have locked their 0/1 cards, create and shuffle the gate deck,
  // then deal the opening hands from that fresh deck.
  const map = MAP_BY_ID[next.mapId]
  const gateRandom = seededRandom((next.seed ^ 0x9e3779b9) >>> 0)
  next.deck = shuffle(buildDeck(), gateRandom)
  const handSize = HAND_SIZE[map.level]
  let dealOrder = 0
  for (let round = 0; round < handSize; round += 1) {
    for (const item of next.players) {
      const card = next.deck.shift()
      item.hand.push({ ...card, dealOrder: dealOrder++ })
    }
  }
  next.players.forEach((item) => { item.initialHand = item.hand.map((card) => ({ ...card })) })
  next.phase = 'play'
  next.stage = stageNumbers(map)[0] ?? 1
  next.stageStarter = next.firstPlayer
  next.currentPlayer = next.firstPlayer
  return next
}

export function gateIds(map) { return map.nodes.filter((node) => node.type === 'gate').map((node) => node.id) }
export function wildIds(map) { return map.nodes.filter((node) => node.type === 'wild').map((node) => node.id) }
export function slotIds(map) { return [...gateIds(map), ...wildIds(map)] }
export function inputOwner(game, inputId) { return game.players.find((item) => item.assignedInputs.includes(inputId))?.id ?? null }
export function visibleInputValue(game, inputId, viewerId, revealAll = false) {
  const owner = inputOwner(game, inputId)
  if (owner === null || (!revealAll && viewerId !== owner)) return null
  return game.players[owner].inputValues[inputId]
}
export function getActionForCard(card) { return { kind: 'gate', cardId: card.id, cardType: card.type } }
export function getWildAction(playerId, side) { return { kind: 'wild', cardId: `wild-p${playerId}`, side } }
export function legalSlotIds(game, action, playerId = game.currentPlayer) {
  if (game.phase !== 'play' || !action || playerId !== game.currentPlayer) return []
  const map = MAP_BY_ID[game.mapId]
  const placements = game.placements || {}
  if (action.kind === 'gate') {
    return map.nodes.filter((node) => node.type === 'gate' && !placements[node.id]).map((node) => node.id)
  }
  if (action.kind !== 'wild' || !['NOT', 'EMPTY'].includes(action.side) || game.players[playerId].wildUsed) return []
  return map.nodes.filter((node) => node.type === 'wild' && !placements[node.id] && !wildPairResolved(game, node)).map((node) => node.id)
}
export function allLegalActions(game, playerId = game.currentPlayer) {
  if (game.phase !== 'play' || playerId !== game.currentPlayer) return []
  const player = game.players[playerId]
  const actions = player.hand.flatMap((card) => {
    const action = getActionForCard(card)
    return legalSlotIds(game, action, playerId).map((slotId) => ({ action, slotId }))
  })
  if (!player.wildUsed) {
    for (const side of ['NOT', 'EMPTY']) {
      const action = getWildAction(playerId, side)
      actions.push(...legalSlotIds(game, action, playerId).map((slotId) => ({ action, slotId })))
    }
  }
  return actions
}
export function playMove(game, slotId, action) {
  if (game.phase !== 'play' || !legalSlotIds(game, action).includes(slotId)) return game
  const next = clone(game)
  const map = MAP_BY_ID[next.mapId]
  const player = next.players[next.currentPlayer]
  const stage = currentStage(next)
  const elapsedMs = Math.max(0, Date.now() - next.startedAt)
  let placement
  if (action.kind === 'gate') {
    const cardIndex = player.hand.findIndex((card) => card.id === action.cardId)
    if (cardIndex < 0) return game
    const [card] = player.hand.splice(cardIndex, 1)
    placement = { playerId: next.currentPlayer, slotId, kind: 'gate', cardId: card.id, cardType: card.type, turn: next.turnNumber, stage, atMs: elapsedMs }
    next.placements[slotId] = placement
    next.moves.push(placement)
  } else {
    const node = map.nodes.find((item) => item.id === slotId)
    if (!node || player.wildUsed || wildPairResolved(next, node)) return game
    const pair = pairedWildNode(map, node)
    const primaryType = action.side === 'NOT' ? 'NOT' : 'EMPTY'
    const pairedType = primaryType === 'NOT' ? 'EMPTY' : 'NOT'
    placement = { playerId: next.currentPlayer, slotId, kind: 'wild', cardId: `wild-p${next.currentPlayer}`, cardType: primaryType, turn: next.turnNumber, stage, atMs: elapsedMs, pair: node.pair || null }
    next.placements[slotId] = placement
    next.moves.push(placement)
    if (pair) {
      const pairedPlacement = { playerId: next.currentPlayer, slotId: pair.id, kind: 'wild', cardId: `wild-auto-${pair.id}-${next.turnNumber}`, cardType: pairedType, turn: next.turnNumber, stage, atMs: elapsedMs, pair: node.pair || null, auto: true }
      next.placements[pair.id] = pairedPlacement
      next.moves.push(pairedPlacement)
    }
    next.players.forEach((item) => { item.wildUsed = true })
  }
  next.turnNumber += 1

  if (allSlotsComplete(next)) {
    next.phase = 'reveal'
    return next
  }
  next.currentPlayer = 1 - next.currentPlayer
  return next
}

export function gateOutput(kind, a, b) {
  if (kind === 'AND') return a & b
  if (kind === 'NAND') return 1 - (a & b)
  if (kind === 'OR') return a | b
  if (kind === 'NOR') return 1 - (a | b)
  return a ^ b
}
export function wildOutput(side, value) { return side === 'NOT' ? 1 - value : value }
export function topologicalOrder(map) {
  const indegree = Object.fromEntries(map.nodes.map((node) => [node.id, 0]))
  const adjacency = Object.fromEntries(map.nodes.map((node) => [node.id, []]))
  map.edges.forEach(([from, to]) => { indegree[to] += 1; adjacency[from].push(to) })
  const queue = map.nodes.filter((node) => indegree[node.id] === 0).map((node) => node.id)
  const output = []
  while (queue.length) {
    const id = queue.shift(); output.push(id)
    adjacency[id].forEach((to) => { indegree[to] -= 1; if (indegree[to] === 0) queue.push(to) })
  }
  return output
}
export function resolveGame(game) {
  const map = MAP_BY_ID[game.mapId]
  const signals = {}
  game.players.forEach((player) => Object.assign(signals, player.inputValues))
  const order = topologicalOrder(map)
  order.forEach((id) => {
    const node = map.nodes.find((item) => item.id === id)
    if (node.type === 'input') return
    const inputs = map.edges.filter(([, to]) => to === id).map(([from]) => signals[from])
    if (node.type === 'gate') signals[id] = gateOutput(game.placements[id].cardType, inputs[0], inputs[1])
    else if (node.type === 'wild') signals[id] = wildOutput(game.placements[id].cardType, inputs[0])
    else if (node.type === 'output' && node.gateType) signals[id] = gateOutput(node.gateType, inputs[0], inputs[1])
    else signals[id] = inputs[0]
  })
  const output = signals.OUT
  const winner = game.players[0].target === output ? 0 : 1
  return { signals, output, winner, order, revealOrder: order.filter((id) => map.nodes.find((node) => node.id === id)?.type !== 'input') }
}
export function finishGame(game, result = resolveGame(game)) { const next = clone(game); next.result = result; next.phase = 'finished'; return next }

export function chooseCpuMove(game) {
  const options = allLegalActions(game, 1)
  if (!options.length) return null
  const random = seededRandom((game.seed ^ ((game.turnNumber + 1) * 0x27d4eb2d)) >>> 0)
  // Sample only information available to the CPU: its own hand and public moves.
  const knownIds = new Set([...game.players[1].initialHand, ...game.moves.filter(m => m.kind === 'gate')].map(c => c.id || c.cardId))
  const unseen = buildDeck().filter(c => !knownIds.has(c.id))
  const samples = Array.from({ length: 64 }, () => ({
    hand: shuffle(unseen, random).slice(0, game.players[0].hand.length),
    inputs: Object.fromEntries(game.players[0].assignedInputs.map(id => [id, random() < .5 ? 0 : 1])),
    seed: Math.floor(random() * 2147483647),
  }))
  const scores = options.map(option => {
    let wins = 0
    for (const sample of samples) {
      let trial = clone(game)
      trial.players[0].hand = sample.hand
      trial.players[0].inputValues = sample.inputs
      trial = playMove(trial, option.slotId, option.action)
      const rng = seededRandom(sample.seed)
      for (let step = 0; trial.phase === 'play' && step < 20; step++) {
        const moves = allLegalActions(trial)
        if (!moves.length) break
        const move = moves[Math.floor(rng() * moves.length)]
        trial = playMove(trial, move.slotId, move.action)
      }
      if (trial.phase === 'reveal' && resolveGame(trial).winner === 1) wins++
    }
    return { ...option, score: wins + random() * .01 }
  })
  return scores.sort((a, b) => b.score - a.score)[0]
}

export function recordFromGame(game) {
  const map = MAP_BY_ID[game.mapId]
  return {
    id: `${Date.now()}-${game.seed}`, playedAt: new Date().toISOString(), seed: game.seed, mode: game.mode, mapId: game.mapId,
    mapVersion: map?.version || null, rulesVersion: game.rulesVersion || RULES_VERSION,
    durationMs: Date.now() - game.startedAt, firstPlayer: game.firstPlayer, targets: game.players.map((player) => player.target),
    inputLayout: game.players.map((player) => [...player.assignedInputs]), inputs: game.players.map((player) => ({ ...player.inputValues })),
    initialHands: game.players.map((player) => player.initialHand.map((card) => card.type)),
    moves: game.moves.map((move) => ({ ...move })), result: game.result ? { ...game.result, signals: { ...game.result.signals } } : null,
  }
}
