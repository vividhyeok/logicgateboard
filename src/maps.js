export const MAPS = [
  {
    id: 'level1_map1', level: 1, code: 'L1 · 01', name: '교차 합류형', version: 'staged-v1',
    description: '두 입력을 나란히 읽고, 한 경로를 한 번 더 가공한 뒤 고정 XOR에서 합칩니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 145 }, { id: 'B', type: 'input', x: 65, y: 375 },
      { id: 'G1', type: 'gate', stage: 1, x: 270, y: 135 }, { id: 'G2', type: 'gate', stage: 1, x: 270, y: 385 },
      { id: 'G3', type: 'gate', stage: 2, x: 500, y: 135 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 690, y: 135 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 690, y: 385 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 910, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','G3'],['A','G3'],['G3','W1'],['G2','W2'],['W1','OUT'],['W2','OUT']],
  },
  {
    id: 'level1_map2', level: 1, code: 'L1 · 02', name: '비대칭 재사용형', version: 'staged-v1',
    description: '한 입력이 중간 단계에서 다시 등장해, 앞선 카드 선택을 다시 해석하게 만듭니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 135 }, { id: 'B', type: 'input', x: 65, y: 385 },
      { id: 'G1', type: 'gate', stage: 1, x: 255, y: 135 }, { id: 'G2', type: 'gate', stage: 1, x: 255, y: 385 },
      { id: 'G3', type: 'gate', stage: 2, x: 500, y: 245 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 690, y: 140 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 690, y: 380 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 910, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','G3'],['B','G3'],['G2','W1'],['G3','W2'],['W1','OUT'],['W2','OUT']],
  },
  {
    id: 'level1_map3', level: 1, code: 'L1 · 03', name: '분기 역추론형', version: 'staged-v1',
    description: '두 초반 결과를 다시 합치고 원본 입력 하나를 보존해, 블러핑과 역추론 여지를 남깁니다.',
    inputGroups: [['A'], ['B']],
    nodes: [
      { id: 'A', type: 'input', x: 65, y: 135 }, { id: 'B', type: 'input', x: 65, y: 385 },
      { id: 'G1', type: 'gate', stage: 1, x: 255, y: 135 }, { id: 'G2', type: 'gate', stage: 1, x: 255, y: 385 },
      { id: 'G3', type: 'gate', stage: 2, x: 500, y: 260 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 700, y: 155 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 700, y: 365 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 915, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','G3'],['G2','G3'],['G3','W1'],['A','W2'],['W1','OUT'],['W2','OUT']],
  },
  {
    id: 'level2_map1', level: 2, code: 'L2 · 01', name: '교차 재사용형', version: 'staged-v1',
    description: '두 입력쌍을 시작으로 중간 신호를 교차 재사용하고, 두 후반 경로를 고정 XOR에서 합칩니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'B', type: 'input', x: 35, y: 175 }, { id: 'C', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 220, y: 115 }, { id: 'G2', type: 'gate', stage: 1, x: 220, y: 395 },
      { id: 'G3', type: 'gate', stage: 2, x: 420, y: 210 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 555, y: 155 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 555, y: 365 },
      { id: 'G4', type: 'gate', stage: 3, x: 745, y: 155 }, { id: 'G5', type: 'gate', stage: 3, x: 745, y: 365 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 935, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['C','G3'],['G3','W1'],['G2','W2'],['W1','G4'],['B','G4'],['W2','G5'],['A','G5'],['G4','OUT'],['G5','OUT']],
  },
  {
    id: 'level2_map2', level: 2, code: 'L2 · 02', name: '긴길·짧은길형', version: 'staged-v1',
    description: '한쪽은 긴 가공 경로, 다른 쪽은 원본 신호가 남는 짧은 경로라 상대의 의도를 다르게 읽어야 합니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'B', type: 'input', x: 35, y: 175 }, { id: 'C', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 215, y: 115 }, { id: 'G2', type: 'gate', stage: 1, x: 215, y: 395 },
      { id: 'G3', type: 'gate', stage: 2, x: 420, y: 205 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 555, y: 155 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 555, y: 365 },
      { id: 'G4', type: 'gate', stage: 3, x: 745, y: 155 }, { id: 'G5', type: 'gate', stage: 3, x: 745, y: 365 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 935, y: 260 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['D','G3'],['G3','W1'],['A','W2'],['W1','G4'],['G2','G4'],['W2','G5'],['C','G5'],['G4','OUT'],['G5','OUT']],
  },
  {
    id: 'level2_map3', level: 2, code: 'L2 · 03', name: '사다리 추론형', version: 'staged-v1',
    description: '엇갈린 입력쌍을 가공하고 중간에서 다시 연결해, 여러 턴의 행동을 함께 봐야 입력을 좁힐 수 있습니다.',
    inputGroups: [['A','C'], ['B','D']],
    nodes: [
      { id: 'A', type: 'input', x: 35, y: 55 }, { id: 'B', type: 'input', x: 35, y: 175 }, { id: 'C', type: 'input', x: 35, y: 335 }, { id: 'D', type: 'input', x: 35, y: 455 },
      { id: 'G1', type: 'gate', stage: 1, x: 215, y: 135 }, { id: 'G2', type: 'gate', stage: 1, x: 215, y: 385 },
      { id: 'G3', type: 'gate', stage: 2, x: 415, y: 255 },
      { id: 'W1', type: 'wild', stage: 2, pair: 'W', x: 555, y: 155 }, { id: 'W2', type: 'wild', stage: 2, pair: 'W', x: 555, y: 365 },
      { id: 'G4', type: 'gate', stage: 3, x: 745, y: 155 }, { id: 'G5', type: 'gate', stage: 3, x: 745, y: 365 },
      { id: 'OUT', type: 'output', gateType: 'XOR', x: 935, y: 260 },
    ],
    edges: [['A','G1'],['C','G1'],['B','G2'],['D','G2'],['G1','G3'],['B','G3'],['G2','W1'],['G3','W2'],['W1','G4'],['A','G4'],['W2','G5'],['D','G5'],['G4','OUT'],['G5','OUT']],
  },
]

// The paired switch is upstream of a playable gate, never a final XOR flip.
// No node has a placement-order restriction; stage remains layout metadata only.
for (const map of MAPS) {
  map.version = 'free-placement-v2'
  if (map.level !== 1) continue
  const positions = { A: [65, 115], B: [65, 405], G1: [265, 135], G2: [265, 365], W1: [460, 135], W2: [460, 365], G3: [675, 250], OUT: [920, 260] }
  map.nodes.forEach(node => { [node.x, node.y] = positions[node.id] })
  const reused = map.id === 'level1_map2' ? 'B' : map.id === 'level1_map3' ? 'G2' : 'A'
  map.edges = [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','W1'],['G2','W2'],['W1','G3'],['W2','G3'],['G3','OUT'],[reused,'OUT']]
  map.description = '빈칸은 처음부터 자유롭게 선택합니다. 한쪽을 뒤집으면 다른 쪽은 통과합니다.'
}

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

