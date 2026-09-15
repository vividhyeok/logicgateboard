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
export function wirePath(map, edge) {
  const [fromId, toId] = edge
  const from = map.nodes.find((node) => node.id === fromId)
  const to = map.nodes.find((node) => node.id === toId)
  const incoming = incomingEdges(map, toId)
  const incomingIndex = incoming.findIndex(([source]) => source === fromId)
  const targetOffset = incoming.length === 2 ? (incomingIndex === 0 ? -17 : 17) : 0
  const sourceX = from.x + (from.type === 'input' ? 37 : 43)
  const targetX = to.x - (to.type === 'output' ? 37 : 43)
  const targetY = to.y + targetOffset
  const midX = sourceX + Math.max(32, (targetX - sourceX) * 0.52)
  return `M ${sourceX} ${from.y} H ${midX} V ${targetY} H ${targetX}`
}
