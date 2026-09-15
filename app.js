(() => {
  'use strict'

  const GATE_TYPES = ['AND', 'NAND', 'OR', 'NOR', 'XOR']
  const WILD_TYPES = ['NOT', 'EMPTY']
  const GATE_COPIES = { AND: 4, NAND: 4, OR: 4, NOR: 4, XOR: 4 }
  const HAND_SIZE = { 1: 4, 2: 5 }
  const PLAYER_META = [
    { name: 'PLAYER 1', short: 'P1', cls: 'p1' },
    { name: 'PLAYER 2', short: 'P2', cls: 'p2' },
  ]
  const GATE_HINT = {
    AND: '둘 다 1 → 1', NAND: 'AND 반전', OR: '하나라도 1 → 1', NOR: 'OR 반전', XOR: '다르면 1',
  }
  const STORAGE_KEY = 'logic-gate-duel-playtests-v1'

  const MAPS = [
    {
      id: 'level1_map1', name: 'LEVEL 1 · MAP 1', subtitle: '기본 합류형', level: 1,
      nodes: [
        { id:'A',type:'input',x:70,y:130},{ id:'B',type:'input',x:70,y:370},
        { id:'G1',type:'gate',x:300,y:120},{ id:'G2',type:'gate',x:300,y:380},
        { id:'G3',type:'gate',x:560,y:250},{ id:'W1',type:'wild',x:750,y:250},{ id:'OUT',type:'output',x:900,y:250},
      ],
      edges:[
        ['A','G1'],['B','G1'],['A','G2'],['B','G2'],['G1','G3'],['G2','G3'],['G3','W1'],['W1','OUT'],
      ],
    },
    {
      id:'level1_map2', name:'LEVEL 1 · MAP 2', subtitle:'비대칭 연쇄형', level:1,
      nodes:[
        {id:'A',type:'input',x:55,y:130},{id:'B',type:'input',x:55,y:380},{id:'G1',type:'gate',x:245,y:250},
        {id:'W1',type:'wild',x:405,y:250},{id:'G2',type:'gate',x:580,y:210},{id:'G3',type:'gate',x:755,y:250},{id:'OUT',type:'output',x:910,y:250},
      ],
      edges:[['A','G1'],['B','G1'],['G1','W1'],['W1','G2'],['A','G2'],['G2','G3'],['B','G3'],['G3','OUT']],
    },
    {
      id:'level1_map3', name:'LEVEL 1 · MAP 3', subtitle:'와일드 선행형', level:1,
      nodes:[
        {id:'A',type:'input',x:70,y:120},{id:'B',type:'input',x:70,y:390},{id:'W1',type:'wild',x:280,y:250},
        {id:'G1',type:'gate',x:470,y:120},{id:'G2',type:'gate',x:470,y:390},{id:'G3',type:'gate',x:700,y:250},{id:'OUT',type:'output',x:900,y:250},
      ],
      edges:[['A','W1'],['W1','G1'],['A','G1'],['W1','G2'],['B','G2'],['G1','G3'],['G2','G3'],['G3','OUT']],
    },
    {
      id:'level2_map1', name:'LEVEL 2 · MAP 1', subtitle:'쌍합류형', level:2,
      nodes:[
        {id:'A',type:'input',x:40,y:60},{id:'B',type:'input',x:40,y:180},{id:'C',type:'input',x:40,y:320},{id:'D',type:'input',x:40,y:440},
        {id:'G1',type:'gate',x:250,y:110},{id:'G2',type:'gate',x:250,y:390},{id:'G3',type:'gate',x:470,y:160},{id:'G4',type:'gate',x:470,y:340},
        {id:'G5',type:'gate',x:660,y:250},{id:'W1',type:'wild',x:805,y:250},{id:'OUT',type:'output',x:925,y:250},
      ],
      edges:[['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['C','G3'],['B','G4'],['G2','G4'],['G3','G5'],['G4','G5'],['G5','W1'],['W1','OUT']],
    },
    {
      id:'level2_map2', name:'LEVEL 2 · MAP 2', subtitle:'비대칭 경로형', level:2,
      nodes:[
        {id:'A',type:'input',x:30,y:60},{id:'B',type:'input',x:30,y:180},{id:'C',type:'input',x:30,y:320},{id:'D',type:'input',x:30,y:440},
        {id:'G1',type:'gate',x:210,y:145},{id:'G2',type:'gate',x:370,y:210},{id:'W1',type:'wild',x:515,y:210},{id:'G3',type:'gate',x:370,y:380},
        {id:'G4',type:'gate',x:660,y:250},{id:'G5',type:'gate',x:805,y:250},{id:'OUT',type:'output',x:930,y:250},
      ],
      edges:[['A','G1'],['B','G1'],['G1','G2'],['C','G2'],['G2','W1'],['W1','G4'],['C','G3'],['D','G3'],['G3','G4'],['A','G5'],['G4','G5'],['G5','OUT']],
    },
    {
      id:'level2_map3', name:'LEVEL 2 · MAP 3', subtitle:'사다리형', level:2,
      nodes:[
        {id:'A',type:'input',x:25,y:55},{id:'B',type:'input',x:25,y:175},{id:'C',type:'input',x:25,y:325},{id:'D',type:'input',x:25,y:445},
        {id:'G1',type:'gate',x:210,y:120},{id:'G2',type:'gate',x:210,y:405},{id:'G3',type:'gate',x:400,y:245},{id:'W1',type:'wild',x:545,y:245},
        {id:'G4',type:'gate',x:700,y:245},{id:'G5',type:'gate',x:830,y:245},{id:'OUT',type:'output',x:940,y:245},
      ],
      edges:[['A','G1'],['B','G1'],['C','G2'],['D','G2'],['G1','G3'],['C','G3'],['G3','W1'],['W1','G4'],['G2','G4'],['B','G5'],['G4','G5'],['G5','OUT']],
    },
  ]

  const app = document.getElementById('app')
  const state = {
    screen: 'menu',
    level: 1,
    mode: 'local',
    game: null,
    selected: null,
    handoff: null,
    privateInputPlayer: null,
    inputDraft: {},
    revealInputs: false,
    signalStep: 0,
    cpuThinking: false,
    logOpen: false,
    wildFace: 'NOT',
    feedback: {},
    records: readRecords(),
    recordedSeed: null,
    autoTimer: null,
    resolveTimer: null,
  }

  function readRecords() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
    catch { return [] }
  }
  function writeRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records)) }
  function getMap(id) { return MAPS.find(m => m.id === id) || MAPS[0] }
  function clone(value) { return structuredClone(value) }
  function rng(seed) {
    let a = seed >>> 0
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  function shuffle(items, random) {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  function buildDeck() { return GATE_TYPES.flatMap(g => Array.from({ length: GATE_COPIES[g] }, () => g)) }
  function blankPlayer(id) { return { id, assignedInputs:[], inputValues:{}, target:null, hand:[], initialHand:[], wildUsed:false } }

  function createGame(mapId, mode, seed = Math.floor(Math.random() * 2147483647)) {
    const map = getMap(mapId), random = rng(seed)
    const inputs = shuffle(map.nodes.filter(n => n.type === 'input').map(n => n.id), random)
    const split = inputs.length / 2
    const players = [blankPlayer(0), blankPlayer(1)]
    players[0].assignedInputs = inputs.slice(0, split).sort()
    players[1].assignedInputs = inputs.slice(split).sort()
    const deck = shuffle(buildDeck(), random)
    const coinWinner = random() < .5 ? 0 : 1
    return {
      seed, mode, mapId, phase:'target_choice', players, deck, initialDeck:[...deck], placements:{}, moves:[], turnNumber:0,
      firstPlayer: 1 - coinWinner, currentPlayer:1 - coinWinner, targetChooser:coinWinner, coinWinner, startedAt:Date.now(), result:null,
    }
  }

  function chooseTarget(game, playerId, target) {
    if (game.phase !== 'target_choice' || game.targetChooser !== playerId) return game
    const next = clone(game)
    next.players[playerId].target = target
    next.players[1-playerId].target = 1-target
    next.phase = 'input_selection'
    return next
  }
  function nextInputPlayer(game) {
    for (const p of game.players) if (Object.keys(p.inputValues).length === 0) return p.id
    return null
  }
  function randomInputsForPlayer(game, playerId) {
    const random = rng((game.seed ^ ((playerId + 7) * 0x85ebca6b)) >>> 0)
    return Object.fromEntries(game.players[playerId].assignedInputs.map(id => [id, random() < .5 ? 0 : 1]))
  }
  function setPlayerInputs(game, playerId, values) {
    if (game.phase !== 'input_selection') return game
    const p = game.players[playerId]
    if (Object.keys(p.inputValues).length || p.assignedInputs.some(id => values[id] === undefined)) return game
    const next = clone(game)
    next.players[playerId].inputValues = { ...values }
    const ready = next.players.every(x => Object.keys(x.inputValues).length === x.assignedInputs.length)
    if (!ready) return next
    const map = getMap(game.mapId), size = HAND_SIZE[map.level]
    for (let r = 0; r < size; r++) {
      for (const player of next.players) {
        const card = next.deck.shift(); if (!card) throw new Error('Deck exhausted')
        player.hand.push(card)
      }
    }
    next.players.forEach(p2 => p2.initialHand = [...p2.hand])
    next.phase = 'play'; next.currentPlayer = next.firstPlayer
    return next
  }
  function gateIds(map) { return map.nodes.filter(n=>n.type==='gate').map(n=>n.id) }
  function wildIds(map) { return map.nodes.filter(n=>n.type==='wild').map(n=>n.id) }
  function slotIds(map) { return [...gateIds(map), ...wildIds(map)] }
  function legalSlotIds(game, action) {
    if (game.phase !== 'play' || !action) return []
    const map = getMap(game.mapId)
    if (action.kind === 'gate') return gateIds(map).filter(id => !game.placements[id])
    if (game.players[game.currentPlayer].wildUsed) return []
    return wildIds(map).filter(id => !game.placements[id])
  }
  function playMove(game, slotId, action) {
    if (game.phase !== 'play' || !legalSlotIds(game, action).includes(slotId)) return game
    const next = clone(game), player = next.players[next.currentPlayer]
    let card, kind
    if (action.kind === 'gate') {
      if (player.hand[action.handIndex] !== action.card) return game
      card = action.card; kind = 'gate'; player.hand.splice(action.handIndex, 1)
    } else {
      if (player.wildUsed) return game
      card = action.side; kind = 'wild'; player.wildUsed = true
    }
    const move = { playerId:next.currentPlayer, slotId, card, kind, turn:next.turnNumber }
    next.placements[slotId] = move; next.moves.push(move); next.turnNumber++
    const done = Object.keys(next.placements).length === slotIds(getMap(next.mapId)).length
    if (done) next.phase = 'reveal'
    else next.currentPlayer = 1 - next.currentPlayer
    return next
  }
  function gateOutput(kind,a,b) {
    if (kind==='AND') return a & b
    if (kind==='NAND') return 1-(a&b)
    if (kind==='OR') return a | b
    if (kind==='NOR') return 1-(a|b)
    return a ^ b
  }
  function wildOutput(side,v) { return side==='NOT' ? 1-v : v }
  function topo(map) {
    const indegree = Object.fromEntries(map.nodes.map(n=>[n.id,0]))
    const adj = Object.fromEntries(map.nodes.map(n=>[n.id,[]]))
    map.edges.forEach(([a,b]) => { indegree[b]++; adj[a].push(b) })
    const q = map.nodes.filter(n=>indegree[n.id]===0).map(n=>n.id), out=[]
    while(q.length){ const id=q.shift(); out.push(id); adj[id].forEach(t=>{ if(--indegree[t]===0) q.push(t) }) }
    return out
  }
  function resolveGame(game) {
    const map=getMap(game.mapId), signals={}
    game.players.forEach(p=>Object.assign(signals,p.inputValues))
    const order=topo(map)
    order.forEach(id=>{
      const node=map.nodes.find(n=>n.id===id); if(node.type==='input') return
      const inc=map.edges.filter(e=>e[1]===id).map(e=>signals[e[0]])
      if(node.type==='gate'){ const m=game.placements[id]; signals[id]=gateOutput(m.card,inc[0],inc[1]) }
      else if(node.type==='wild'){ const m=game.placements[id]; signals[id]=wildOutput(m.card,inc[0]) }
      else signals[id]=inc[0]
    })
    const output=signals.OUT, winner=game.players[0].target===output?0:1
    return { signals, output, winner, order }
  }
  function finishGame(game) { const n=clone(game); n.result=resolveGame(n); n.phase='finished'; return n }
  function inputOwner(game,id) { const p=game.players.find(p=>p.assignedInputs.includes(id)); return p ? p.id : null }
  function visibleInputValue(game,id,viewer,revealAll) {
    const p=game.players.find(p=>p.assignedInputs.includes(id)); if(!p) return null
    return revealAll || p.id===viewer ? (p.inputValues[id] ?? null) : null
  }

  function allCandidates(game) {
    const map=getMap(game.mapId), p=game.players[game.currentPlayer], out=[]
    gateIds(map).filter(s=>!game.placements[s]).forEach(slotId=>p.hand.forEach((card,handIndex)=>out.push({slotId,action:{kind:'gate',handIndex,card}})))
    if(!p.wildUsed) wildIds(map).filter(s=>!game.placements[s]).forEach(slotId=>WILD_TYPES.forEach(side=>out.push({slotId,action:{kind:'wild',side}})))
    return out
  }
  function randomAction(game, random) { const a=allCandidates(game); return a.length?a[Math.floor(random()*a.length)]:null }
  function chooseCpuMove(game, cpuId=1) {
    if(game.phase!=='play'||game.currentPlayer!==cpuId) return null
    const candidates=allCandidates(game); if(!candidates.length) return null
    const random=rng((game.seed ^ (game.turnNumber*0x9e3779b9))>>>0), rollouts=getMap(game.mapId).level===2?20:30
    let best=candidates[0], bestScore=-1
    candidates.forEach(candidate=>{
      let wins=0
      for(let r=0;r<rollouts;r++){
        let sim=clone(game), human=1-cpuId, sampled={}
        sim.players[human].assignedInputs.forEach(id=>sampled[id]=random()<.5?0:1)
        sim.players[human].inputValues=sampled
        sim=playMove(sim,candidate.slotId,candidate.action)
        while(sim.phase==='play'){ const nxt=randomAction(sim,random); if(!nxt) break; sim=playMove(sim,nxt.slotId,nxt.action) }
        if(sim.phase==='reveal' && resolveGame(sim).winner===cpuId) wins++
      }
      const score=wins/rollouts+random()*1e-4
      if(score>bestScore){bestScore=score;best=candidate}
    })
    return best
  }

  function gateIcon(type) {
    const isAnd=type==='AND'||type==='NAND', isOr=type==='OR'||type==='NOR'||type==='XOR', bubble=type==='NAND'||type==='NOR'
    return `<svg class="gate-symbol" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      ${isAnd?'<path d="M18 18 H45 C67 18 79 31 79 50 C79 69 67 82 45 82 H18 Z"/>':''}
      ${isOr?'<path d="M20 18 C36 20 59 22 76 34 C84 40 89 46 91 50 C89 54 84 60 76 66 C59 78 36 80 20 82 C30 63 31 37 20 18 Z"/>':''}
      ${type==='XOR'?'<path d="M12 18 C22 37 22 63 12 82"/>':''}<path d="M4 34 H20 M4 66 H20"/>${bubble?'<path d="M91 50 H94"/><circle cx="85" cy="50" r="7"/>':'<path d="M79 50 H96"/>'}</g></svg>`
  }
  function gateCard(type, opts={}) {
    const compact=opts.compact?'compact':'', selected=opts.selected?'selected':'', action=opts.action?`data-action="select-gate" data-index="${opts.index}"`:''
    const owner=opts.owner!==undefined?`<span class="owner-dot ${PLAYER_META[opts.owner].cls}">${PLAYER_META[opts.owner].short}</span>`:''
    return `<button class="gate-card gate-${type.toLowerCase()} ${selected} ${compact}" ${action} ${opts.disabled?'disabled':''} type="button"><span class="corner corner-top">${type}</span><span class="gate-core">${gateIcon(type)}<strong>${type}</strong>${opts.compact?'':`<small>${GATE_HINT[type]}</small>`}</span><span class="corner corner-bottom">${type}</span>${owner}</button>`
  }
  function wildCard(side, opts={}) {
    const compact=opts.compact?'compact':'', selected=opts.selected?'selected':'', action=opts.action?'data-action="select-wild"':''
    const owner=opts.owner!==undefined?`<span class="owner-dot ${PLAYER_META[opts.owner].cls}">${PLAYER_META[opts.owner].short}</span>`:''
    return `<button class="wild-card ${selected} ${compact}" ${action} type="button"><span class="corner corner-top">WILD</span><span class="wild-core"><strong>${side}</strong>${opts.compact?'':`<small>${side==='NOT'?'0 ↔ 1 반전':'신호 그대로 통과'}</small>`}</span><span class="corner corner-bottom">W</span>${owner}</button>`
  }
  function inputCard(value, hidden, owner) { return `<div class="input-card ${hidden?'hidden-value':''} ${owner===0?'p1-border':owner===1?'p2-border':''}"><span>INPUT</span><strong>${hidden||value===null?'?':value}</strong>${owner!==null?`<em>${PLAYER_META[owner].short}</em>`:''}</div>` }
  function outputCard(value){ return `<div class="output-card"><span>OUTPUT</span><strong>${value===null?'?':value}</strong></div>` }
  function targetCard(target,player){return `<div class="target-card ${PLAYER_META[player].cls}"><span>${PLAYER_META[player].short} TARGET</span><strong>${target??'?'}</strong></div>`}

  function edgePath(map, sourceId,targetId){
    const s=map.nodes.find(n=>n.id===sourceId), t=map.nodes.find(n=>n.id===targetId), sp=s.type==='wild'?45:44,tp=t.type==='wild'?45:44
    const sx=s.x+sp,tx=t.x-tp,mx=sx+Math.max(24,(tx-sx)*.48)
    return `M ${sx} ${s.y} H ${mx} V ${t.y} H ${tx}`
  }
  function miniBoard(map){
    return `<svg viewBox="0 0 1000 500" class="mini-board-svg">${map.edges.map(e=>`<path d="${edgePath(map,e[0],e[1])}" class="mini-wire"/>`).join('')}${map.nodes.map(n=>{const fill=n.type==='input'?'#f5f0e7':n.type==='output'?'#ffcf4a':n.type==='wild'?'#ff785a':'#161512',stroke=n.type==='gate'?'#f5f0e7':'#161512';return `<rect x="${n.x-28}" y="${n.y-38}" width="56" height="76" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`}).join('')}</svg>`
  }

  function renderMenu(){
    const maps=MAPS.filter(m=>m.level===state.level)
    app.innerHTML=`<main class="menu-screen">
      <header class="brand-header"><div class="brand-mark">LG</div><div><p>PHYSICAL GAME PLAYTEST</p><h1>LOGIC GATE <em>DUEL</em></h1><span>상대의 INPUT을 읽고, 회로의 마지막 한 수를 차지하세요.</span></div></header>
      <section class="mode-row">
        <button class="mode-card ${state.mode==='local'?'active':''}" data-action="mode" data-mode="local"><b class="mode-icon">2P</b><div><strong>PASS & PLAY</strong><span>실물 카드게임과 가장 가까운 테스트</span></div></button>
        <button class="mode-card ${state.mode==='cpu'?'active':''}" data-action="mode" data-mode="cpu"><b class="mode-icon">CPU</b><div><strong>VS CPU</strong><span>혼자 규칙과 맵 흐름 빠르게 확인</span></div></button>
      </section>
      <section class="level-tabs"><button class="${state.level===1?'active':''}" data-action="level" data-level="1">LEVEL 1</button><button class="${state.level===2?'active':''}" data-action="level" data-level="2">LEVEL 2</button></section>
      <section class="map-grid">${maps.map(map=>`<article class="map-card"><div class="map-miniature">${miniBoard(map)}</div><div class="map-card-copy"><span>${map.name}</span><strong>${map.subtitle}</strong><p>${map.level===1?'Gate 3 + Wild 1 · 각 2턴':'Gate 5 + Wild 1 · 각 3턴'}</p></div><button class="start-map-button" data-action="start" data-map="${map.id}">이 맵으로 시작</button></article>`).join('')}</section>
      <footer class="menu-footer"><span>현재 브라우저 테스트 기록 <strong>${state.records.length}판</strong></span>${state.records.length?'<button data-action="export">↓ JSON 내보내기</button>':''}</footer>
    </main>`
  }

  function boardHtml(game, viewer){
    const map=getMap(game.mapId), legal=new Set(legalSlotIds(game,state.selected)), result=game.result||(game.phase==='reveal'?resolveGame(game):null), revealAll=state.revealInputs||game.phase==='finished'
    const visibleIds=result?new Set(result.order.slice(0,state.signalStep)):new Set()
    const wires=map.edges.map(e=>{const known=visibleIds.has(e[0]),sig=known?result.signals[e[0]]:null;return `<path class="wire ${known?(sig===1?'signal-one':'signal-zero'):''}" d="${edgePath(map,e[0],e[1])}"/>`}).join('')
    const nodes=map.nodes.map(n=>{
      const style=`left:${n.x/10}%;top:${n.y/5}%`, visible=visibleIds.has(n.id), badge=visible?`<span class="signal-badge s${result.signals[n.id]}">${result.signals[n.id]}</span>`:''
      if(n.type==='input'){const owner=inputOwner(game,n.id),v=visibleInputValue(game,n.id,viewer,revealAll);return `<div class="node input-node" style="${style}"><span class="node-id">${n.id}</span>${inputCard(v,v===null,owner)}${badge}</div>`}
      if(n.type==='output'){const out=game.phase==='finished'?game.result.output:null;return `<div class="node output-node" style="${style}">${outputCard(out)}${badge}</div>`}
      const p=game.placements[n.id],isLegal=legal.has(n.id), content=!p?`<span class="empty-slot"><small>${n.type==='wild'?'WILD':'GATE'}</small><strong>${n.id}</strong>${isLegal?'<em>PLACE</em>':''}</span>`:p.kind==='gate'?gateCard(p.card,{compact:true,owner:p.playerId}):wildCard(p.card,{compact:true,owner:p.playerId})
      return `<button class="node slot-node ${n.type==='wild'?'wild-slot':''} ${isLegal?'legal':''}" style="${style}" ${isLegal?`data-action="place" data-slot="${n.id}"`:''} type="button">${content}${badge}</button>`
    }).join('')
    return `<div class="board-shell"><div class="board-title-row"><div><strong>${map.name}</strong><span>${map.subtitle}</span></div><span>${map.level===1?'4 SLOTS · 2 INPUTS':'6 SLOTS · 4 INPUTS'}</span></div><div class="board-scroll"><div class="circuit-board"><svg class="wires" viewBox="0 0 1000 500" preserveAspectRatio="none"><defs><marker id="arrow-neutral" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polygon points="0 0, 7 3.5, 0 7" fill="currentColor"/></marker></defs>${wires}</svg>${nodes}</div></div></div>`
  }

  function renderTargetDialog(game){return `<section class="center-dialog"><span>${PLAYER_META[game.targetChooser].name}</span><h2>내 목표 OUTPUT을 고르세요</h2><p>동전 승자에게 목표 선택권. 상대는 반대 목표를 받고 먼저 시작합니다.</p><div class="target-options"><button data-action="target" data-value="0"><strong>0</strong><span>OUTPUT 0</span></button><button data-action="target" data-value="1"><strong>1</strong><span>OUTPUT 1</span></button></div></section>`}
  function renderInputDialog(game, player){
    return `<section class="center-dialog"><span>${PLAYER_META[player].name} · SECRET INPUT</span><h2>내 INPUT 값을 정하세요</h2><p>이 값은 카드 배치가 끝날 때까지 상대에게 공개되지 않습니다.</p><div class="input-choice-grid">${game.players[player].assignedInputs.map(id=>`<div class="input-picker"><strong>INPUT ${id}</strong><div><button class="${state.inputDraft[id]===0?'active':''}" data-action="input-value" data-id="${id}" data-value="0">0</button><button class="${state.inputDraft[id]===1?'active':''}" data-action="input-value" data-id="${id}" data-value="1">1</button></div></div>`).join('')}</div><button class="primary-button" data-action="confirm-inputs">값 확정하고 넘기기</button></section>`
  }
  function handoffHtml(h){return `<div class="handoff-overlay"><div class="handoff-card ${PLAYER_META[h.player].cls}"><span>PASS THE SCREEN</span><strong>${PLAYER_META[h.player].name}</strong><p>${h.message}</p><button class="primary-button" data-action="handoff-ready">준비됐어요</button></div></div>`}

  function renderGame(){
    const game=state.game,map=getMap(game.mapId), isCpu=id=>game.mode==='cpu'&&id===1
    if(game.phase==='target_choice' && !isCpu(game.targetChooser) && !state.handoff){ app.innerHTML=baseGameHeader(game,map)+renderTargetDialog(game)+'</main>'; return }
    if(game.phase==='input_selection' && state.privateInputPlayer!==null){ app.innerHTML=baseGameHeader(game,map)+renderInputDialog(game,state.privateInputPlayer)+'</main>'+(state.handoff?handoffHtml(state.handoff):'');return }

    let main=''
    if(['play','reveal','finished'].includes(game.phase)){
      const viewer=game.phase==='play'?game.currentPlayer:(state.privateInputPlayer??game.targetChooser), current=game.players[game.currentPlayer],opp=game.players[1-game.currentPlayer]
      const turnText=game.phase==='play'?(state.cpuThinking?'CPU가 수를 읽는 중…':state.selected?`${state.selected.kind==='gate'?state.selected.card:state.selected.side} 선택됨 · 빈 슬롯을 누르세요`:'손패에서 카드 한 장을 고르세요'):game.phase==='reveal'?(state.revealInputs?'INPUT 공개 완료 · 회로를 실행하세요':'숨겨진 INPUT을 공개할 시간입니다'):`OUTPUT ${game.result.output} · ${PLAYER_META[game.result.winner].name} 승리`
      main+=`<section class="game-status-strip">${targetCard(game.players[0].target,0)}<div class="turn-center"><span>${game.phase==='play'?(isCpu(game.currentPlayer)?'CPU TURN':PLAYER_META[game.currentPlayer].name+' TURN'):game.phase==='reveal'?'REVEAL':'ROUND COMPLETE'}</span><strong>${turnText}</strong></div>${targetCard(game.players[1].target,1)}</section>`
      if(game.phase==='play'){
        main+=`<section class="opponent-rack"><div class="rack-label"><span>${game.mode==='cpu'?'CPU':PLAYER_META[opp.id].name}</span><em>공개 손패 ${opp.hand.length}장</em></div><div class="mini-hand">${opp.hand.map(c=>gateCard(c,{compact:true})).join('')}${!opp.wildUsed?wildCard('NOT',{compact:true}):''}</div></section>`
      }
      main+=boardHtml(game,viewer)
      if(game.phase==='play'){
        main+=`<section class="hand-rack"><div class="rack-label"><span>${isCpu(current.id)?'CPU HAND':PLAYER_META[current.id].name+' · MY HAND'}</span><em>${current.hand.length} gate cards · Wild ${current.wildUsed?'사용함':'보유'}</em></div><div class="hand-cards">${current.hand.map((c,i)=>gateCard(c,{selected:state.selected&&state.selected.kind==='gate'&&state.selected.handIndex===i,action:!isCpu(current.id),index:i})).join('')}${!current.wildUsed?`<div class="wild-hand-wrap">${wildCard(state.wildFace,{selected:state.selected&&state.selected.kind==='wild',action:!isCpu(current.id)})}<button class="flip-wild" data-action="flip-wild">⇄ 뒤집기</button></div>`:''}</div>${state.selected?'<button class="cancel-selection" data-action="cancel">× 선택 취소</button>':''}</section>`
      }
      if(game.phase==='reveal'){
        main+=`<section class="reveal-controls">${!state.revealInputs?'<button class="primary-button" data-action="reveal-inputs">✦ INPUT 공개</button>':state.signalStep===0?'<button class="primary-button" data-action="resolve">▶ 회로 실행</button>':`<span class="resolving-label">신호 계산 중 · ${state.signalStep}</span>`}</section>`
      }
      if(game.phase==='finished') main+=resultHtml(game)
      main+=logHtml(game)
    }
    app.innerHTML=baseGameHeader(game,map)+main+'</main>'+(state.handoff?handoffHtml(state.handoff):'')
  }
  function baseGameHeader(game,map){return `<main class="game-screen"><header class="game-topbar"><button class="icon-button" data-action="exit">←</button><div class="game-brand"><strong>LOGIC GATE DUEL</strong><span>${map.name} · ${map.subtitle}</span></div><div class="topbar-actions"><span class="seed-label">#${game.seed.toString(16).slice(-6).toUpperCase()}</span><button class="icon-button" data-action="rematch">↻</button></div></header>`}
  function resultHtml(game){
    const f=state.feedback||{}
    return `<section class="result-panel"><div class="winner-block"><span>WINNER</span><strong>${PLAYER_META[game.result.winner].name}</strong><p>최종 OUTPUT <b>${game.result.output}</b> · 목표 ${game.players[game.result.winner].target}</p></div><div class="feedback-block"><span>이 판 어땠나요? <small>테스트 기록에 저장됩니다.</small></span><div class="feedback-row"><em>템포</em>${[['slow','느림'],['good','적당'],['fast','빠름']].map(([v,l])=>`<button class="${f.pace===v?'active':''}" data-action="feedback" data-key="pace" data-value="${v}">${l}</button>`).join('')}</div><div class="feedback-row"><em>체감 밸런스</em>${[['p1','P1 유리'],['even','비슷'],['p2','P2 유리']].map(([v,l])=>`<button class="${f.balance===v?'active':''}" data-action="feedback" data-key="balance" data-value="${v}">${l}</button>`).join('')}</div><input id="feedback-note" value="${escapeAttr(f.note||'')}" placeholder="메모 (선택)" /></div><div class="result-actions"><button class="primary-button" data-action="rematch">같은 맵 재대결</button><button class="secondary-button" data-action="exit">다른 맵 고르기</button></div></section>`
  }
  function logHtml(game){return `<section class="log-panel"><button class="log-toggle" data-action="toggle-log"><span>TURN LOG · ${game.moves.length}</span><b>${state.logOpen?'⌄':'⌃'}</b></button>${state.logOpen?`<div class="log-list">${game.moves.length?[...game.moves].reverse().map(m=>`<div><b>${m.turn+1}</b><span>${PLAYER_META[m.playerId].short}</span><strong>${m.card}</strong><em>→ ${m.slotId}</em></div>`).join(''):'<p>아직 배치된 카드가 없습니다.</p>'}</div>`:''}</section>`}
  function escapeAttr(s){return String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}

  function render(){ clearTimeout(state.autoTimer); state.autoTimer=null; if(state.screen==='menu')renderMenu();else renderGame(); if(state.screen==='game') scheduleAuto() }
  function isCpu(id){return state.game&&state.game.mode==='cpu'&&id===1}
  function scheduleAuto(){
    const game=state.game; if(!game||state.handoff) return
    if(game.phase==='target_choice'&&isCpu(game.targetChooser)){state.cpuThinking=true;state.autoTimer=setTimeout(()=>{state.game=chooseTarget(state.game,1,(state.game.seed>>>3)&1);state.cpuThinking=false;prepareInputPhase()},400);return}
    if(game.phase==='input_selection'){
      const next=nextInputPlayer(game); if(next===null)return
      if(isCpu(next)){state.cpuThinking=true;state.autoTimer=setTimeout(()=>{state.game=setPlayerInputs(state.game,next,randomInputsForPlayer(state.game,next));state.cpuThinking=false;prepareInputPhase()},400);return}
      if(state.privateInputPlayer===null){ if(game.mode==='local') state.handoff={player:next,message:`내가 맡은 INPUT ${game.players[next].assignedInputs.join(', ')}의 값을 비밀리에 정하세요.`}; else openInput(next); render(); }
      return
    }
    if(game.phase==='play'&&isCpu(game.currentPlayer)&&!state.cpuThinking){state.cpuThinking=true;renderGame();state.autoTimer=setTimeout(()=>{const c=chooseCpuMove(state.game,1); if(c) state.game=playMove(state.game,c.slotId,c.action);state.cpuThinking=false;state.selected=null;render()},550)}
  }
  function prepareInputPhase(){state.handoff=null;state.privateInputPlayer=null;state.inputDraft={};render()}
  function openInput(player){state.privateInputPlayer=player;state.inputDraft=Object.fromEntries(state.game.players[player].assignedInputs.map(id=>[id,0]));state.handoff=null}

  function start(mapId){
    state.screen='game';state.game=createGame(mapId,state.mode);state.selected=null;state.privateInputPlayer=null;state.inputDraft={};state.revealInputs=false;state.signalStep=0;state.feedback={};state.recordedSeed=null;state.logOpen=false;state.wildFace='NOT'
    if(state.game.mode==='local') state.handoff={player:state.game.targetChooser,message:'목표 OUTPUT 0 또는 1을 고르세요. 선택 후 상대에게 화면을 넘깁니다.'}
    else state.handoff=null
    render()
  }
  function rematch(){const id=state.game.mapId,mode=state.game.mode;start(id);state.mode=mode}
  function recordFinished(){
    const g=state.game;if(!g.result||state.recordedSeed===g.seed)return
    state.recordedSeed=g.seed
    state.records.push({id:`${Date.now()}-${g.seed}`,playedAt:new Date().toISOString(),mapId:g.mapId,mode:g.mode,seed:g.seed,durationMs:Date.now()-g.startedAt,firstPlayer:g.firstPlayer,targetChooser:g.targetChooser,targets:[g.players[0].target,g.players[1].target],assignedInputs:[g.players[0].assignedInputs,g.players[1].assignedInputs],inputValues:[g.players[0].inputValues,g.players[1].inputValues],initialHands:[g.players[0].initialHand,g.players[1].initialHand],moves:g.moves,output:g.result.output,winner:g.result.winner})
    writeRecords()
  }
  function updateFeedback(key,value){state.feedback={...state.feedback,[key]:value};const i=state.records.findLastIndex(r=>r.seed===state.game.seed);if(i>=0){state.records[i].feedback={...(state.records[i].feedback||{}),...state.feedback};writeRecords()}render()}
  function exportRecords(){const blob=new Blob([JSON.stringify(state.records,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`logic-gate-duel-playtests-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}

  app.addEventListener('click', event => {
    const el=event.target.closest('[data-action]'); if(!el)return
    const action=el.dataset.action
    if(action==='mode'){state.mode=el.dataset.mode;render()}
    else if(action==='level'){state.level=Number(el.dataset.level);render()}
    else if(action==='start')start(el.dataset.map)
    else if(action==='export')exportRecords()
    else if(action==='exit'){state.screen='menu';state.game=null;state.handoff=null;render()}
    else if(action==='rematch')rematch()
    else if(action==='handoff-ready'){
      const g=state.game,h=state.handoff;state.handoff=null
      if(g.phase==='input_selection')openInput(h.player)
      render()
    }
    else if(action==='target'){
      state.game=chooseTarget(state.game,state.game.targetChooser,Number(el.dataset.value));state.handoff=null;prepareInputPhase()
    }
    else if(action==='input-value'){state.inputDraft[el.dataset.id]=Number(el.dataset.value);render()}
    else if(action==='confirm-inputs'){
      const p=state.privateInputPlayer;state.game=setPlayerInputs(state.game,p,state.inputDraft);state.privateInputPlayer=null;state.inputDraft={}
      if(state.game.phase==='play'&&state.game.mode==='local')state.handoff={player:state.game.currentPlayer,message:'카드 배치를 시작합니다. 상대의 INPUT을 추리하면서 한 장씩 놓으세요.'}
      render()
    }
    else if(action==='select-gate'){
      if(isCpu(state.game.currentPlayer))return
      const i=Number(el.dataset.index),card=state.game.players[state.game.currentPlayer].hand[i]
      if(state.selected&&state.selected.kind==='gate'&&state.selected.handIndex===i)state.selected=null;else state.selected={kind:'gate',handIndex:i,card};render()
    }
    else if(action==='select-wild'){if(isCpu(state.game.currentPlayer))return;state.selected={kind:'wild',side:state.wildFace};render()}
    else if(action==='flip-wild'){state.wildFace=state.wildFace==='NOT'?'EMPTY':'NOT';if(state.selected&&state.selected.kind==='wild')state.selected={kind:'wild',side:state.wildFace};render()}
    else if(action==='cancel'){state.selected=null;render()}
    else if(action==='place'){
      if(!state.selected)return;const before=state.game.currentPlayer;state.game=playMove(state.game,el.dataset.slot,state.selected);state.selected=null
      if(state.game.phase==='play'&&state.game.mode==='local'&&state.game.currentPlayer!==before)state.handoff={player:state.game.currentPlayer,message:`상대가 ${el.dataset.slot}에 카드를 놓았습니다. 내 차례입니다.`}
      render()
    }
    else if(action==='reveal-inputs'){state.revealInputs=true;render()}
    else if(action==='resolve'){
      const result=resolveGame(state.game);state.signalStep=1;render()
      let step=1;clearInterval(state.resolveTimer);state.resolveTimer=setInterval(()=>{step++;state.signalStep=step;if(step>=result.order.length){clearInterval(state.resolveTimer);setTimeout(()=>{state.game=finishGame(state.game);state.signalStep=result.order.length;recordFinished();render()},300)}else render()},300)
    }
    else if(action==='toggle-log'){state.logOpen=!state.logOpen;render()}
    else if(action==='feedback')updateFeedback(el.dataset.key,el.dataset.value)
  })

  app.addEventListener('input', event => {
    if(event.target.id==='feedback-note'){ state.feedback={...state.feedback,note:event.target.value}; const i=state.records.findLastIndex(r=>r.seed===state.game.seed); if(i>=0){state.records[i].feedback={...(state.records[i].feedback||{}),...state.feedback};writeRecords()} }
  })

  render()
})()
