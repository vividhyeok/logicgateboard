export const MAPS = [
  {
    id: 'level1_map1', level: 1, code: 'L1 · 01', name: '기본 합류형', description: '두 입력을 병렬로 가공한 뒤 하나로 합류합니다.',
    nodes: [
      { id: 'A', type: 'input', x: 70, y: 130 }, { id: 'B', type: 'input', x: 70, y: 370 },
      { id: 'G1', type: 'gate', x: 300, y: 120 }, { id: 'G2', type: 'gate', x: 300, y: 380 },
      { id: 'G3', type: 'gate', x: 560, y: 250 }, { id: 'W1', type: 'wild', x: 750, y: 250 }, { id: 'OUT', type: 'output', x: 900, y: 250 },
    ],
    edges: [['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','G3'],['G2','G3'],['G3','W1'],['W1','OUT']],
  },
  {
    id: 'level1_map2', level: 1, code: 'L1 · 02', name: '비대칭 연쇄형', description: '한 입력이 여러 단계에 다시 합류하는 비대칭 구조입니다.',
    nodes: [
      { id: 'A', type: 'input', x: 55, y: 130 }, { id: 'B', type: 'input', x: 55, y: 380 },
      { id: 'G1', type: 'gate', x: 245, y: 250 }, { id: 'W1', type: 'wild', x: 405, y: 250 },
      { id: 'G2', type: 'gate', x: 580, y: 210 }, { id: 'G3', type: 'gate', x: 755, y: 250 }, { id: 'OUT', type: 'output', x: 910, y: 250 },
    ],
    edges: [['A','G1'],['B','G1'],['G1','W1'],['W1','G2'],['A','G2'],['G2','G3'],['B','G3'],['G3','OUT']],
  },
  {
    id: 'level1_map3', level: 1, code: 'L1 · 03', name: '와일드 선행형', description: 'Wild의 선택이 초반부터 두 갈래에 동시에 영향을 줍니다.',
    nodes: [
      { id: 'A', type: 'input', x: 70, y: 120 }, { id: 'B', type: 'input', x: 70, y: 390 },
      { id: 'W1', type: 'wild', x: 280, y: 250 }, { id: 'G1', type: 'gate', x: 470, y: 120 },
      { id: 'G2', type: 'gate', x: 470, y: 390 }, { id: 'G3', type: 'gate', x: 700, y: 250 }, { id: 'OUT', type: 'output', x: 900, y: 250 },
    ],
    edges: [['A','W1'],['W1','G1'],['A','G1'],['W1','G2'],['B','G2'],['G1','G3'],['G2','G3'],['G3','OUT']],
  },
  {
    id: 'level2_map1', level: 2, code: 'L2 · 01', name: '쌍합류형', description: '두 쌍의 입력이 각각 결합된 뒤 다시 교차하고 합류합니다.',
    nodes: [
      { id: 'A', type: 'input', x: 40, y: 60 }, { id: 'B', type: 'input', x: 40, y: 180 }, { id: 'C', type: 'input', x: 40, y: 320 }, { id: 'D', type: 'input', x: 40, y: 440 },
      { id: 'G1', type: 'gate', x: 250, y: 110 }, { id: 'G2', type: 'gate', x: 250, y: 390 }, { id: 'G3', type: 'gate', x: 470, y: 160 }, { id: 'G4', type: 'gate', x: 470, y: 340 },
      { id: 'G5', type: 'gate', x: 660, y: 250 }, { id: 'W1', type: 'wild', x: 805, y: 250 }, { id: 'OUT', type: 'output', x: 925, y: 250 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['C','G3'],['B','G4'],['G2','G4'],['G3','G5'],['G4','G5'],['G5','W1'],['W1','OUT']],
  },
  {
    id: 'level2_map2', level: 2, code: 'L2 · 02', name: '비대칭 경로형', description: '상단의 긴 체인과 하단의 짧은 체인이 후반에 충돌합니다.',
    nodes: [
      { id: 'A', type: 'input', x: 30, y: 60 }, { id: 'B', type: 'input', x: 30, y: 180 }, { id: 'C', type: 'input', x: 30, y: 320 }, { id: 'D', type: 'input', x: 30, y: 440 },
      { id: 'G1', type: 'gate', x: 210, y: 145 }, { id: 'G2', type: 'gate', x: 370, y: 210 }, { id: 'W1', type: 'wild', x: 515, y: 210 }, { id: 'G3', type: 'gate', x: 370, y: 380 },
      { id: 'G4', type: 'gate', x: 660, y: 250 }, { id: 'G5', type: 'gate', x: 805, y: 250 }, { id: 'OUT', type: 'output', x: 930, y: 250 },
    ],
    edges: [['A','G1'],['B','G1'],['G1','G2'],['C','G2'],['G2','W1'],['W1','G4'],['C','G3'],['D','G3'],['G3','G4'],['A','G5'],['G4','G5'],['G5','OUT']],
  },
  {
    id: 'level2_map3', level: 2, code: 'L2 · 03', name: '사다리형', description: '초반 두 갈래를 중간에서 연결한 뒤 긴 후반 체인으로 이어집니다.',
    nodes: [
      { id: 'A', type: 'input', x: 25, y: 55 }, { id: 'B', type: 'input', x: 25, y: 175 }, { id: 'C', type: 'input', x: 25, y: 325 }, { id: 'D', type: 'input', x: 25, y: 445 },
      { id: 'G1', type: 'gate', x: 210, y: 120 }, { id: 'G2', type: 'gate', x: 210, y: 405 }, { id: 'G3', type: 'gate', x: 400, y: 245 }, { id: 'W1', type: 'wild', x: 545, y: 245 },
      { id: 'G4', type: 'gate', x: 700, y: 245 }, { id: 'G5', type: 'gate', x: 830, y: 245 }, { id: 'OUT', type: 'output', x: 940, y: 245 },
    ],
    edges: [['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['C','G3'],['G3','W1'],['W1','G4'],['G2','G4'],['B','G5'],['G4','G5'],['G5','OUT']],
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
    source: { x: from.x + sourceHalf.x + 7, y: from.y },
    target: { x: to.x - targetHalf.x - 7, y: to.y + targetOffset },
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
