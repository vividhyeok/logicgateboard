import Peer from 'peerjs'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeRoomCode(length = 6) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join('')
}

export function roomPeerId(code) {
  return `logic-gate-duel-${String(code).trim().toLowerCase()}`
}

export function inviteUrl(code) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('online', '1')
  url.searchParams.set('room', String(code).toUpperCase())
  return url.toString()
}

export function createHostPeer(code, handlers = {}) {
  const peer = new Peer(roomPeerId(code))
  let connection = null

  peer.on('open', () => handlers.onReady?.())
  peer.on('connection', (next) => {
    if (connection?.open) {
      next.on('open', () => next.close())
      return
    }
    connection = next
    connection.on('open', () => handlers.onConnected?.(connection))
    connection.on('data', (data) => handlers.onData?.(data, connection))
    connection.on('close', () => handlers.onDisconnected?.())
    connection.on('error', (error) => handlers.onError?.(error))
  })
  peer.on('error', (error) => handlers.onError?.(error))

  return {
    peer,
    send(data) { if (connection?.open) connection.send(data) },
    connected() { return Boolean(connection?.open) },
    destroy() { try { connection?.close() } catch {} try { peer.destroy() } catch {} },
  }
}

export function createGuestPeer(code, handlers = {}) {
  const peer = new Peer()
  let connection = null

  peer.on('open', () => {
    connection = peer.connect(roomPeerId(code), { reliable: true, serialization: 'json' })
    connection.on('open', () => handlers.onConnected?.(connection))
    connection.on('data', (data) => handlers.onData?.(data, connection))
    connection.on('close', () => handlers.onDisconnected?.())
    connection.on('error', (error) => handlers.onError?.(error))
  })
  peer.on('error', (error) => handlers.onError?.(error))

  return {
    peer,
    send(data) { if (connection?.open) connection.send(data) },
    connected() { return Boolean(connection?.open) },
    destroy() { try { connection?.close() } catch {} try { peer.destroy() } catch {} },
  }
}

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
  return copy
}
