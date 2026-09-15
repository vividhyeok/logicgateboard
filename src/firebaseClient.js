import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBY9IcnQOfmTkzLzQGU_6I68Nx32fUrEwM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'logicgateboard.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://logicgateboard-default-rtdb.asia-southeast1.firebasedatabase.app/',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'logicgateboard',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'logicgateboard.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '172401327121',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:172401327121:web:e95707ecc75d86ea0485b0',
}

const REQUIRED = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId']

export function isFirebaseConfigured() {
  return REQUIRED.every((key) => Boolean(firebaseConfig[key]))
}

export function firebaseMissingKeys() {
  return REQUIRED.filter((key) => !firebaseConfig[key])
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(`Firebase is not configured. Missing: ${firebaseMissingKeys().join(', ')}`)
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseDatabase() {
  return getDatabase(getFirebaseApp())
}
