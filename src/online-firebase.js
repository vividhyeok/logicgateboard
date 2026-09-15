import { get, onChildAdded, onDisconnect, onValue, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { getFirebaseDatabase } from './firebaseClient.js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DISCONNECT_GRACE_MS = 5000
const COMMAND_RETRY_MS = 1400
const COMMAND_TTL_MS = 30000

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

function sessionId(role) {
  return `${role}-${messageId()}`.replace(/[^a-zA-Z0-9-]/g, '')
}

function roomRefs(db, code, role, clientId) {
  const room = String(code).trim().toUpperCase()
  const base = `rooms/${room}`
  return {
    root: ref(db, base),
    meta: ref(db, `${base}/meta`),
    ownPresence: ref(db, `${base}/presence/${role}/${clientId}`),
    hostPresence: ref(db, `${base}/presence/host`),
    guestPresence: ref(db, `${base}/presence/guest`),
    guestCommands: ref(db, `${base}/messages/guestToHost`),
    hostLatest: ref(db, `${base}/messages/hostToGuest/latest`),
    guestAcks: ref(db, `${base}/messages/guestAcks`),
    infoConnected: ref(db, '.info/connected'),
  }
}

function presenceValue(role, clientId) {
  return { online: true, role, clientId, at: serverTimestamp() }
}

function isOnline(snapshot) {
  const value = snapshot.val()
  if (value === true || value?.online === true) return true
  return value && Object.values(value).some((entry) => entry?.online === true)
}

function clearDisconnectTimer(timer) {
  if (timer) window.clearTimeout(timer)
  return null
}

export function createHostPeer(code, handlers = {}) {
  const db = getFirebaseDatabase()
  const clientId = sessionId('host')
  const refs = roomRefs(db, code, 'host', clientId)
  let closed = false
  let connected = false
  let disconnectTimer = null
  const unsubscribers = []

  function applyGuestPresence(next) {
    if (closed) return
    if (next) {
      disconnectTimer = clearDisconnectTimer(disconnectTimer)
      if (!connected) {
        connected = true
        handlers.onConnected?.()
      }
      return
    }
    if (!connected || disconnectTimer) return
    disconnectTimer = window.setTimeout(() => {
      disconnectTimer = null
      if (closed || !connected) return
      connected = false
      handlers.onDisconnected?.()
    }, DISCONNECT_GRACE_MS)
  }

  ;(async () => {
    try {
      const existing = await get(refs.meta)
      if (!existing.exists()) {
        await set(refs.meta, {
          code: String(code).trim().toUpperCase(),
          createdAt: serverTimestamp(),
          transport: 'firebase-rtdb',
          status: 'waiting',
        })
      } else {
        await update(refs.meta, { transport: 'firebase-rtdb', lastHostSeenAt: serverTimestamp() })
      }

      unsubscribers.push(onValue(refs.infoConnected, async (snapshot) => {
        if (closed || snapshot.val() !== true) return
        try {
          await onDisconnect(refs.ownPresence).remove()
          await set(refs.ownPresence, presenceValue('host', clientId))
          handlers.onTransportReady?.()
        } catch (error) {
          if (!closed) handlers.onError?.(error)
        }
      }))

      unsubscribers.push(onValue(refs.guestPresence, (snapshot) => {
        applyGuestPresence(isOnline(snapshot))
      }))

      unsubscribers.push(onChildAdded(refs.guestCommands, async (snapshot) => {
        const message = snapshot.val()
        if (!message?.payload) {
          try { await remove(snapshot.ref) } catch {}
          return
        }
        try {
          await handlers.onData?.(message.payload, message.id)
          if (message.id) await set(ref(db, `rooms/${String(code).trim().toUpperCase()}/messages/guestAcks/${message.id}`), { at: serverTimestamp() })
          await remove(snapshot.ref)
        } catch (error) {
          if (!closed) handlers.onError?.(error)
        }
      }))

      handlers.onReady?.()
    } catch (error) {
      if (!closed) handlers.onError?.(error)
    }
  })()

  return {
    send(data) {
      if (closed) return
      set(refs.hostLatest, {
        id: messageId(),
        sentAt: serverTimestamp(),
        payload: data,
      }).catch((error) => handlers.onError?.(error))
    },
    connected() { return connected },
    async setMeta(values = {}) {
      if (closed) return
      await update(refs.meta, { ...values, updatedAt: serverTimestamp() })
    },
    async getMeta() {
      const snapshot = await get(refs.meta)
      return snapshot.val()
    },
    async closeRoom() {
      closed = true
      disconnectTimer = clearDisconnectTimer(disconnectTimer)
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      try { await remove(refs.root) } catch {}
    },
    async destroy() {
      closed = true
      disconnectTimer = clearDisconnectTimer(disconnectTimer)
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      try { await remove(refs.ownPresence) } catch {}
    },
  }
}

export function createGuestPeer(code, handlers = {}) {
  const db = getFirebaseDatabase()
  const clientId = sessionId('guest')
  const refs = roomRefs(db, code, 'guest', clientId)
  let closed = false
  let connected = false
  let disconnectTimer = null
  let lastHostMessageId = null
  let pendingHostPayload = null
  const unsubscribers = []
  const pendingCommands = new Map()

  function stopPending(id) {
    const pending = pendingCommands.get(id)
    if (!pending) return
    window.clearInterval(pending.timer)
    pendingCommands.delete(id)
  }

  function writeCommand(id, payload) {
    if (closed) return
    set(ref(db, `rooms/${String(code).trim().toUpperCase()}/messages/guestToHost/${id}`), {
      id, clientId, sentAt: serverTimestamp(), payload,
    }).catch((error) => { if (!closed) handlers.onError?.(error) })
  }

  function deliverPendingHostPayload() {
    if (!connected || !pendingHostPayload) return
    const payload = pendingHostPayload
    pendingHostPayload = null
    handlers.onData?.(payload)
  }

  function applyHostPresence(next) {
    if (closed) return
    if (next) {
      disconnectTimer = clearDisconnectTimer(disconnectTimer)
      if (!connected) {
        connected = true
        handlers.onConnected?.()
      }
      deliverPendingHostPayload()
      return
    }
    if (!connected || disconnectTimer) return
    disconnectTimer = window.setTimeout(() => {
      disconnectTimer = null
      if (closed || !connected) return
      connected = false
      handlers.onDisconnected?.()
    }, DISCONNECT_GRACE_MS)
  }

  ;(async () => {
    try {
      const roomSnapshot = await get(refs.meta)
      if (!roomSnapshot.exists()) {
        const error = new Error('방을 찾을 수 없습니다.')
        error.code = 'room-not-found'
        handlers.onError?.(error)
        return
      }

      handlers.onMeta?.(roomSnapshot.val())

      unsubscribers.push(onValue(refs.infoConnected, async (snapshot) => {
        if (closed || snapshot.val() !== true) return
        try {
          await onDisconnect(refs.ownPresence).remove()
          await set(refs.ownPresence, presenceValue('guest', clientId))
          handlers.onTransportReady?.()
        } catch (error) {
          if (!closed) handlers.onError?.(error)
        }
      }))

      unsubscribers.push(onValue(refs.hostPresence, (snapshot) => {
        applyHostPresence(isOnline(snapshot))
      }))

      unsubscribers.push(onValue(refs.meta, (snapshot) => {
        if (!snapshot.exists()) {
          if (!closed) handlers.onRoomClosed?.()
          return
        }
        handlers.onMeta?.(snapshot.val())
      }))

      unsubscribers.push(onValue(refs.hostLatest, (snapshot) => {
        const message = snapshot.val()
        if (!message?.id || message.id === lastHostMessageId) return
        lastHostMessageId = message.id
        if (!connected) {
          pendingHostPayload = message.payload
          return
        }
        handlers.onData?.(message.payload)
      }))

      unsubscribers.push(onChildAdded(refs.guestAcks, (snapshot) => {
        stopPending(snapshot.key)
        remove(snapshot.ref).catch(() => {})
      }))
    } catch (error) {
      if (!closed) handlers.onError?.(error)
    }
  })()

  return {
    send(data) {
      if (closed) return
      const id = messageId().replace(/[^a-zA-Z0-9-]/g, '')
      const startedAt = Date.now()
      const timer = window.setInterval(() => {
        if (Date.now() - startedAt > COMMAND_TTL_MS) {
          stopPending(id)
          handlers.onDeliveryTimeout?.(data)
          return
        }
        writeCommand(id, data)
      }, COMMAND_RETRY_MS)
      pendingCommands.set(id, { timer })
      writeCommand(id, data)
      return id
    },
    connected() { return connected },
    async getMeta() {
      const snapshot = await get(refs.meta)
      return snapshot.val()
    },
    async destroy() {
      closed = true
      disconnectTimer = clearDisconnectTimer(disconnectTimer)
      pendingCommands.forEach(({ timer }) => window.clearInterval(timer))
      pendingCommands.clear()
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      try { await remove(refs.ownPresence) } catch {}
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
