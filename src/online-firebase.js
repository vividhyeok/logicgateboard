import { get, onDisconnect, onValue, ref, remove, serverTimestamp, set } from 'firebase/database'
import { getFirebaseDatabase } from './firebaseClient.js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeRoomCode(length = 6) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join('')
}

export function inviteUrl(code) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('online', '1')
  url.searchParams.set('room', String(code).trim().toUpperCase())
  return url.toString()
}

function messageId() {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return `${Date.now()}-${bytes[0].toString(36)}`
}

function roomRefs(db, code) {
  const room = String(code).trim().toUpperCase()
  const base = `rooms/${room}`
  return {
    root: ref(db, base),
    meta: ref(db, `${base}/meta`),
    hostOnline: ref(db, `${base}/presence/host`),
    guestOnline: ref(db, `${base}/presence/guest`),
    toHost: ref(db, `${base}/messages/toHost`),
    toGuest: ref(db, `${base}/messages/toGuest`),
  }
}

function writeMessage(targetRef, payload) {
  return set(targetRef, {
    id: messageId(),
    sentAt: serverTimestamp(),
    payload,
  })
}

export function createHostPeer(code, handlers = {}) {
  const db = getFirebaseDatabase()
  const refs = roomRefs(db, code)
  let closed = false
  let connected = false
  let lastGuestMessageId = null
  const unsubscribers = []

  ;(async () => {
    try {
      await set(refs.meta, {
        code: String(code).trim().toUpperCase(),
        createdAt: serverTimestamp(),
        transport: 'firebase-rtdb',
      })
      await set(refs.hostOnline, true)
      onDisconnect(refs.hostOnline).remove()
      onDisconnect(refs.root).remove()

      unsubscribers.push(onValue(refs.guestOnline, (snapshot) => {
        const next = snapshot.val() === true
        if (next && !connected) handlers.onConnected?.()
        if (!next && connected) handlers.onDisconnected?.()
        connected = next
      }))

      unsubscribers.push(onValue(refs.toHost, (snapshot) => {
        const message = snapshot.val()
        if (!message?.id || message.id === lastGuestMessageId) return
        lastGuestMessageId = message.id
        handlers.onData?.(message.payload)
      }))

      handlers.onReady?.()
    } catch (error) {
      if (!closed) handlers.onError?.(error)
    }
  })()

  return {
    send(data) {
      if (closed) return
      writeMessage(refs.toGuest, data).catch((error) => handlers.onError?.(error))
    },
    connected() { return connected },
    async destroy() {
      closed = true
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      try { await remove(refs.root) } catch {}
    },
  }
}

export function createGuestPeer(code, handlers = {}) {
  const db = getFirebaseDatabase()
  const refs = roomRefs(db, code)
  let closed = false
  let connected = false
  let lastHostMessageId = null
  const unsubscribers = []

  ;(async () => {
    try {
      const roomSnapshot = await get(refs.meta)
      if (!roomSnapshot.exists()) {
        const error = new Error('방을 찾을 수 없습니다.')
        error.code = 'room-not-found'
        handlers.onError?.(error)
        return
      }

      await set(refs.guestOnline, true)
      onDisconnect(refs.guestOnline).remove()

      unsubscribers.push(onValue(refs.hostOnline, (snapshot) => {
        const next = snapshot.val() === true
        if (next && !connected) handlers.onConnected?.()
        if (!next && connected) handlers.onDisconnected?.()
        connected = next
      }))

      unsubscribers.push(onValue(refs.toGuest, (snapshot) => {
        const message = snapshot.val()
        if (!message?.id || message.id === lastHostMessageId) return
        lastHostMessageId = message.id
        handlers.onData?.(message.payload)
      }))
    } catch (error) {
      if (!closed) handlers.onError?.(error)
    }
  })()

  return {
    send(data) {
      if (closed) return
      writeMessage(refs.toHost, data).catch((error) => handlers.onError?.(error))
    },
    connected() { return connected },
    async destroy() {
      closed = true
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      try { await remove(refs.guestOnline) } catch {}
    },
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
