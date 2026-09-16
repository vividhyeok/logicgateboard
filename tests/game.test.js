import test from 'node:test'
import assert from 'node:assert/strict'
import { MAPS } from '../src/maps.js'
import { HAND_SIZE, createGame, chooseTarget, setPlayerInputs, legalSlotIds, allLegalActions, playMove, resolveGame, chooseCpuMove, topologicalOrder } from '../src/game.js'
import { snapshotForPlayer } from '../src/snapshot.js'
function ready(map, seed=123) {
  let g=createGame(map.id,'cpu',seed)
  g=chooseTarget(g,g.targetChooser,0)
  for(const p of g.players) g=setPlayerInputs(g,p.id,Object.fromEntries(p.assignedInputs.map(id=>[id,p.id])))
  return g
}
test('gate deck is created only after both players lock their 0/1 inputs',()=>{
  const map=MAPS[0]
  let g=createGame(map.id,'local',123)
  assert.equal(g.deck.length,0)
  assert.deepEqual(g.players.map(p=>p.hand.length),[0,0])
  g=chooseTarget(g,g.targetChooser,0)
  const first=g.players[0]
  g=setPlayerInputs(g,0,Object.fromEntries(first.assignedInputs.map(id=>[id,0])))
  assert.equal(g.phase,'input_selection')
  assert.equal(g.deck.length,0)
  assert.deepEqual(g.players.map(p=>p.hand.length),[0,0])
  const second=g.players[1]
  g=setPlayerInputs(g,1,Object.fromEntries(second.assignedInputs.map(id=>[id,1])))
  const handSize=HAND_SIZE[map.level]
  assert.equal(g.phase,'play')
  assert.deepEqual(g.players.map(p=>p.hand.length),[handSize,handSize])
  assert.equal(g.deck.length,20-handSize*2)
})
test('every map permits rear gates and both switches on the first turn',()=>{
  for(const map of MAPS){
    const g=ready(map), p=g.players[g.currentPlayer]
    assert.deepEqual(legalSlotIds(g,{kind:'gate',cardId:p.hand[0].id}),map.nodes.filter(n=>n.type==='gate').map(n=>n.id))
    assert.equal(legalSlotIds(g,{kind:'wild',side:'EMPTY'}).length,2)
    assert.equal(topologicalOrder(map).length,map.nodes.length)
  }
})
test('both switch faces resolve their pair exactly once and alternate turns',()=>{
 for(const map of MAPS) for(const side of ['NOT','EMPTY']){
  const g=ready(map), next=playMove(g,'W1',{kind:'wild',side})
  assert.equal(next.placements.W1.cardType,side)
  assert.equal(next.placements.W2.cardType,side==='NOT'?'EMPTY':'NOT')
  assert.equal(next.currentPlayer,1-g.currentPlayer)
  assert.deepEqual(legalSlotIds(next,{kind:'wild',side}),[])
 }
})
test('all maps terminate without deadlock across varied free move orders',()=>{
 for(const map of MAPS) for(let seed=1;seed<=100;seed++){
  let g=ready(map,seed), steps=0
  while(g.phase==='play'){
   const moves=allLegalActions(g);assert.ok(moves.length)
   const m=moves[(seed+steps*7)%moves.length];g=playMove(g,m.slotId,m.action);assert.ok(++steps<10)
  }
  assert.equal(g.phase,'reveal');const r=resolveGame(g)
  assert.ok([0,1].includes(r.output));assert.ok(Object.values(r.signals).every(v=>[0,1].includes(v)))
 }
})
test('reject invalid targets, foreign inputs, invalid bits and malformed actions',()=>{
 let g=createGame(MAPS[0].id);assert.equal(chooseTarget(g,g.targetChooser,4),g)
 g=chooseTarget(g,g.targetChooser,0)
 assert.equal(setPlayerInputs(g,0,{[g.players[0].assignedInputs[0]]:2}),g)
 assert.equal(setPlayerInputs(g,0,{A:0,B:1}),g)
 const r=ready(MAPS[0]);assert.equal(playMove(r,'W1',{kind:'evil',side:'NOT'}),r)
 assert.equal(playMove(r,'W1',{kind:'wild',side:'invalid'}),r)
})
test('guest snapshot hides opponent hand, input, deck and deal seed',()=>{
 const g=ready(MAPS[0]), snap=snapshotForPlayer(g,1)
 assert.deepEqual(snap.players[0].hand,[]);assert.deepEqual(snap.players[0].inputValues,{})
 assert.ok(snap.deck.every(c=>c===null));assert.notEqual(snap.seed,g.seed)
 assert.equal(snap.players[1].hand.length,g.players[1].hand.length)
 assert.notEqual(g.deck[0],null)
})
test('CPU decision is independent of actual hidden opponent inputs and cards',()=>{
 const g=ready(MAPS[0]);g.currentPlayer=1
 const other=structuredClone(g)
 for(const id of other.players[0].assignedInputs)other.players[0].inputValues[id]^=1
 other.players[0].hand=other.players[0].hand.map(c=>({...c,type:'XOR'}))
 const a=chooseCpuMove(g),b=chooseCpuMove(other)
 assert.deepEqual(a,b)
})
test('switch placement can change the result on each map',()=>{
 for(const map of MAPS){
  let influential=false
  for(let seed=1;seed<=100&&!influential;seed++){
   let g=ready(map,seed)
   while(g.phase==='play') {const moves=allLegalActions(g);const m=moves[(seed+g.turnNumber*3)%moves.length];g=playMove(g,m.slotId,m.action)}
   const other=structuredClone(g)
   for(const id of ['W1','W2'])other.placements[id].cardType=g.placements[id].cardType==='NOT'?'EMPTY':'NOT'
   influential=resolveGame(g).output!==resolveGame(other).output
  }
  assert.ok(influential,map.id)
 }
})