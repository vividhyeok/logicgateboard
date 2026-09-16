export function snapshotForPlayer(game, viewerId) {
  if (!game) return null
  const revealPrivate = game.phase === 'reveal' || game.phase === 'finished'
  const copy = structuredClone(game)
  copy.players = copy.players.map((player, index) => {
    if (index === viewerId) return { ...player, handCount: player.hand.length }
    return {
      ...player,
      handCount: player.hand.length,
      hand: [],
      initialHand: [],
      inputValues: revealPrivate ? { ...player.inputValues } : {},
    }
  })
  // Do not send the shuffled deck or deterministic deal seed to the opponent.
  copy.deck = Array(game.deck.length).fill(null)
  copy.seed = game.startedAt
  return copy
}

