const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://logicgateboard-default-rtdb.asia-southeast1.firebasedatabase.app'

export default async function handler(request, response) {
  const code = String(request.query?.code || '').toUpperCase()
  if (request.method !== 'GET') return response.status(405).json({ error: 'method not allowed' })
  if (!/^[A-Z0-9]{6}$/.test(code)) return response.status(400).json({ error: 'invalid room code' })
  try {
    const upstream = await fetch(`${DATABASE_URL}/rooms/${code}/messages/guestToHost.json`, { cache: 'no-store' })
    if (!upstream.ok) return response.status(502).json({ error: `firebase ${upstream.status}` })
    response.setHeader('Cache-Control', 'no-store, max-age=0')
    return response.status(200).json((await upstream.json()) || {})
  } catch (error) {
    return response.status(503).json({ error: error?.message || 'relay unavailable' })
  }
}
