export const MAPS = [
  {
    id: 'level1_map1', level: 1, code: 'L1 · 01', name: '끝자리 쟁탈형', version: 'strategy-v3',
    description: '두 갈래를 만든 뒤 WILD로 한쪽만 뒤집고, 마지막 게이트에서 승부합니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 140 }, { id: 'B', type: 'input', x: 65, y: 380 },
      { id: 'G1', type: 'gate', stage: 1, x: 270, y: 140 }, { id: 'G2', type: 'gate', stage: 1, x: 270, y: 380 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 485, y: 140 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 485, y: 380 },
      { id: 'G3', type: 'gate', stage: 3, x: 710, y: 260 },
      { id: 'OUT', type: 'output', x: 920, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','W1'],['G2','W2'],['W1','G3'],['W2','G3'],['G3','OUT']],
  },
  {
    id: 'level1_map2', level: 1, code: 'L1 · 02', name: '교차 반전형', version: 'strategy-v3',
    description: '비밀 입력 바로 앞의 WILD 때문에 같은 게이트도 놓인 위치와 타이밍에 따라 의미가 달라집니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 140 }, { id: 'B', type: 'input', x: 65, y: 380 },
      { id: 'W1', type: 'wild', stage: 1, pair: 'W', x: 260, y: 140 }, { id: 'W2', type: 'wild', stage: 1, pair: 'W', x: 260, y: 380 },
      { id: 'G1', type: 'gate', stage: 2, x: 500, y: 155 }, { id: 'G2', type: 'gate', stage: 2, x: 500, y: 365 },
      { id: 'G3', type: 'gate', stage: 3, x: 735, y: 260 },
      { id: 'OUT', type: 'output', x: 930, y: 260 },
    ],
    edges: [['A','W1'],['B','W2'],['W1','G1'],['B','G1'],['A','G2'],['W2','G2'],['G1','G3'],['G2','G3'],['G3','OUT']],
  },
  {
    id: 'level1_map3', level: 1, code: 'L1 · 03', name: '쌍두 결승형', version: 'strategy-v3',
    description: '마지막 한 칸 대신 두 후반 게이트가 맞붙습니다. XOR는 이 맵에서만 결승 규칙으로 작동합니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 140 }, { id: 'B', type: 'input', x: 65, y: 380 },
      { id: 'G1', type: 'gate', stage: 1, x: 280, y: 260 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 485, y: 145 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 485, y: 375 },
      { id: 'G2', type: 'gate', stage: 3, x: 705, y: 145 }, { id: 'G3', type: 'gate', stage: 3, x: 705, y: 375 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 925, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['G1','W1'],['G1','W2'],['W1','G2'],['A','G2'],['W2','G3'],['B','G3'],['G2','OUT'],['G3','OUT']],
  },
  {
    id: 'level2_map1', level: 2, code: 'L2 · 01', name: '중앙 허브형', version: 'strategy-v3',
    description: '서로의 입력을 섞은 두 신호가 중앙에서 합쳐졌다가 다시 갈라져, 한 수의 의미가 여러 길에 남습니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'B', type: 'input', x: 35, y: 175 }, { id: 'C', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 215, y: 115 }, { id: 'G2', type: 'gate', stage: 1, x: 215, y: 395 },
      { id: 'G3', type: 'gate', stage: 2, x: 420, y: 260 },
      { id: 'W1', type: 'wild', stage: 3, pair: 'W', x: 590, y: 145 }, { id: 'W2', type: 'wild', stage: 3, pair: 'W', x: 590, y: 375 },
      { id: 'G4', type: 'gate', stage: 4, x: 770, y: 145 }, { id: 'G5', type: 'gate', stage: 4, x: 770, y: 375 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 945, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['G2','G3'],['G3','W1'],['G3','W2'],['W1','G4'],['C','G4'],['W2','G5'],['A','G5'],['G4','OUT'],['G5','OUT']],
  },
  {
    id: 'level2_map2', level: 2, code: 'L2 · 02', name: '긴길·지름길형', version: 'strategy-v3',
    description: '한쪽은 여러 번 가공되고 다른 쪽은 비밀 입력이 후반까지 바로 살아남아, 어느 길을 믿을지 계속 바뀝니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'B', type: 'input', x: 35, y: 175 }, { id: 'C', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 205, y: 110 }, { id: 'G2', type: 'gate', stage: 1, x: 205, y: 400 },
      { id: 'G3', type: 'gate', stage: 2, x: 395, y: 180 },
      { id: 'W1', type: 'wild', stage: 3, pair: 'W', x: 555, y: 155 }, { id: 'W2', type: 'wild', stage: 3, pair: 'W', x: 555, y: 385 },
      { id: 'G4', type: 'gate', stage: 4, x: 720, y: 170 },
      { id: 'G5', type: 'gate', stage: 5, x: 835, y: 300 },
      { id: 'OUT', type: 'output', x: 955, y: 300 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['D','G3'],['G3','W1'],['C','W2'],['W1','G4'],['G2','G4'],['G4','G5'],['W2','G5'],['G5','OUT']],
  },
  {
    id: 'level2_map3', level: 2, code: 'L2 · 03', name: '맞대결 분기형', version: 'strategy-v3',
    description: '각자의 두 입력이 한 가지에서 먼저 묶이고, 원본 입력 하나씩이 다시 끼어들어 블러핑과 역추론이 오래 남습니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'C', type: 'input', x: 35, y: 175 }, { id: 'B', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 215, y: 115 }, { id: 'G2', type: 'gate', stage: 1, x: 215, y: 395 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 425, y: 165 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 425, y: 355 },
      { id: 'G3', type: 'gate', stage: 3, x: 635, y: 155 }, { id: 'G4', type: 'gate', stage: 3, x: 635, y: 365 },
      { id: 'G5', type: 'gate', stage: 4, x: 830, y: 260 },
      { id: 'OUT', type: 'output', x: 955, y: 260 },
    ],
    edges: [['A','G1'],['C','G1'],['B','G2'],['D','G2'],['A','W1'],['D','W2'],['G1','G3'],['W1','G3'],['G2','G4'],['W2','G4'],['G3','G5'],['G4','G5'],['G5','OUT']],
  },
]

export const MAP_BY_ID = Object.fromEntries(MAPS.map((map) => [map.id, map]))
export function incomingEdges(map, nodeId) { return map.edges.filter(([, to]) => to === nodeId) }

const ROUTE_CACHE = new WeakMap()
const BOARD_HEIGHT = 520
const EDGE_MARGIN = 14

function nodeHalfSize(node) {
  return node.type === 'gate' || node.type === 'wild'
    ? { x: 40, y: 61 }
    : { x: 32, y: 47 }
}

function edgePorts(map, edge) {
  const [fromId, toId] = edge
  const from = map.nodes.find((node) => node.id === fromId)
  const to = map.nodes.find((node) => node.id === toId)
  const incoming = incomingEdges(map, toId)
  const incomingIndex = incoming.findIndex(([source]) => source === fromId)
  const targetOffset = incoming.length === 2 ? (incomingIndex === 0 ? -17 : 17) : 0
  const sourceHalf = nodeHalfSize(from)
  const targetHalf = nodeHalfSize(to)
  return {
    source: { x: from.x + sourceHalf.x, y: from.y },
    target: { x: to.x - targetHalf.x, y: to.y + targetOffset },
  }
}

function compactPoints(points) {
  const deduped = points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y)
  return deduped.filter((point, index) => {
    if (index === 0 || index === deduped.length - 1) return true
    const prev = deduped[index - 1]
    const next = deduped[index + 1]
    return !((prev.x === point.x && point.x === next.x) || (prev.y === point.y && point.y === next.y))
  })
}

function segments(points) {
  const result = []
  for (let index = 0; index < points.length - 1; index += 1) result.push([points[index], points[index + 1]])
  return result
}

function segmentHitsRect([a, b], rect) {
  if (a.y === b.y) {
    const left = Math.min(a.x, b.x)
    const right = Math.max(a.x, b.x)
    return a.y > rect.top && a.y < rect.bottom && right > rect.left && left < rect.right
  }
  if (a.x === b.x) {
    const top = Math.min(a.y, b.y)
    const bottom = Math.max(a.y, b.y)
    return a.x > rect.left && a.x < rect.right && bottom > rect.top && top < rect.bottom
  }
  return false
}

function obstacleCount(map, edge, points) {
  const [fromId, toId] = edge
  return map.nodes.reduce((count, node) => {
    if (node.id === fromId || node.id === toId) return count
    const half = nodeHalfSize(node)
    const rect = {
      left: node.x - half.x - 8,
      right: node.x + half.x + 8,
      top: node.y - half.y - 8,
      bottom: node.y + half.y + 8,
    }
    return count + (segments(points).some((segment) => segmentHitsRect(segment, rect)) ? 1 : 0)
  }, 0)
}

function segmentConflictPenalty([a, b], [c, d]) {
  const firstHorizontal = a.y === b.y
  const secondHorizontal = c.y === d.y

  if (firstHorizontal === secondHorizontal) {
    if (firstHorizontal && a.y !== c.y) return 0
    if (!firstHorizontal && a.x !== c.x) return 0
    const firstStart = firstHorizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y)
    const firstEnd = firstHorizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y)
    const secondStart = firstHorizontal ? Math.min(c.x, d.x) : Math.min(c.y, d.y)
    const secondEnd = firstHorizontal ? Math.max(c.x, d.x) : Math.max(c.y, d.y)
    const overlap = Math.max(0, Math.min(firstEnd, secondEnd) - Math.max(firstStart, secondStart))
    return overlap > 2 ? 4000 + overlap * 20 : 0
  }

  const horizontal = firstHorizontal ? [a, b] : [c, d]
  const vertical = firstHorizontal ? [c, d] : [a, b]
  const crossingX = vertical[0].x
  const crossingY = horizontal[0].y
  const hMin = Math.min(horizontal[0].x, horizontal[1].x)
  const hMax = Math.max(horizontal[0].x, horizontal[1].x)
  const vMin = Math.min(vertical[0].y, vertical[1].y)
  const vMax = Math.max(vertical[0].y, vertical[1].y)
  return crossingX > hMin + 2 && crossingX < hMax - 2 && crossingY > vMin + 2 && crossingY < vMax - 2 ? 1100 : 0
}

function routeConflictPenalty(points, existingRoutes) {
  return existingRoutes.reduce((total, route) => total + segments(points).reduce(
    (routeTotal, segment) => routeTotal + segments(route).reduce((segmentTotal, otherSegment) => segmentTotal + segmentConflictPenalty(segment, otherSegment), 0),
    0,
  ), 0)
}

function candidateRoutes(map, edge) {
  const { source, target } = edgePorts(map, edge)
  const candidates = []
  const deltaX = target.x - source.x

  if (source.y === target.y) candidates.push([source, target])

  ;[0.28, 0.42, 0.55, 0.68, 0.82].forEach((ratio) => {
    const midX = source.x + deltaX * ratio
    candidates.push([source, { x: midX, y: source.y }, { x: midX, y: target.y }, target])
  })

  const stub = Math.min(24, Math.max(10, deltaX * 0.18))
  const startX = source.x + stub
  const endX = target.x - stub
  const lanes = new Set([
    16, 34, 58, 88, 118, 148, 178, 208, 238, 268, 298, 328, 358, 388, 418, 448, 478, 504,
    source.y, target.y, (source.y + target.y) / 2,
  ])

  const [fromId, toId] = edge
  map.nodes.forEach((node) => {
    if (node.id === fromId || node.id === toId) return
    const half = nodeHalfSize(node)
    lanes.add(Math.max(EDGE_MARGIN, node.y - half.y - 12))
    lanes.add(Math.min(BOARD_HEIGHT - EDGE_MARGIN, node.y + half.y + 12))
  })

  lanes.forEach((laneY) => {
    candidates.push([
      source,
      { x: startX, y: source.y },
      { x: startX, y: laneY },
      { x: endX, y: laneY },
      { x: endX, y: target.y },
      target,
    ])
  })

  return candidates.map(compactPoints)
}

function routeLength(points) {
  return segments(points).reduce((total, [a, b]) => total + Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 0)
}

function buildWireRoutes(map) {
  const cached = ROUTE_CACHE.get(map)
  if (cached) return cached

  const nodeById = Object.fromEntries(map.nodes.map((node) => [node.id, node]))
  const orderedEdges = [...map.edges].sort((first, second) => {
    const firstSpan = nodeById[first[1]].x - nodeById[first[0]].x
    const secondSpan = nodeById[second[1]].x - nodeById[second[0]].x
    return secondSpan - firstSpan || map.edges.indexOf(first) - map.edges.indexOf(second)
  })

  const routes = new Map()
  const existingRoutes = []

  orderedEdges.forEach((edge) => {
    let bestRoute = null
    let bestScore = Number.POSITIVE_INFINITY

    candidateRoutes(map, edge).forEach((candidate) => {
      const collisions = obstacleCount(map, edge, candidate)
      const conflicts = routeConflictPenalty(candidate, existingRoutes)
      const length = routeLength(candidate)
      const bends = Math.max(0, candidate.length - 2)
      const edgePenalty = candidate.reduce((total, point) => total + (point.y < 20 || point.y > 500 ? 5 : 0), 0)
      const score = collisions * 100000 + conflicts + length + bends * 12 + edgePenalty

      if (score < bestScore) {
        bestScore = score
        bestRoute = candidate
      }
    })

    routes.set(`${edge[0]}>${edge[1]}`, bestRoute)
    existingRoutes.push(bestRoute)
  })

  ROUTE_CACHE.set(map, routes)
  return routes
}

function routeToPath(points) {
  if (!points?.length) return ''
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]
    const point = points[index]
    path += prev.y === point.y ? ` H ${point.x}` : ` V ${point.y}`
  }
  return path
}

export function wirePath(map, edge) {
  const route = buildWireRoutes(map).get(`${edge[0]}>${edge[1]}`)
  return routeToPath(route)
}

