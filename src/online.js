import { isFirebaseConfigured } from './firebaseClient.js'
import {
  createGuestPeer as createFirebaseGuestPeer,
  createHostPeer as createFirebaseHostPeer,
  inviteUrl,
  makeRoomCode,
  snapshotForPlayer,
} from './online-firebase.js'

export { inviteUrl, makeRoomCode, snapshotForPlayer }

function unavailableSession(handlers = {}) {
  const error = new Error('Firebase 설정이 아직 완료되지 않았습니다. Vercel 환경 변수와 Realtime Database를 설정한 뒤 다시 배포해 주세요.')
  error.code = 'firebase-not-configured'
  queueMicrotask(() => handlers.onError?.(error))
  return {
    send() {},
    connected() { return false },
    destroy() {},
  }
}

export function createHostPeer(code, handlers = {}) {
  if (!isFirebaseConfigured()) return unavailableSession(handlers)
  return createFirebaseHostPeer(code, handlers)
}

export function createGuestPeer(code, handlers = {}) {
  if (!isFirebaseConfigured()) return unavailableSession(handlers)
  return createFirebaseGuestPeer(code, handlers)
}
