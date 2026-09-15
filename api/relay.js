const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://logicgateboard-default-rtdb.asia-southeast1.firebasedatabase.app'
const ALLOWED_PATH = /^messages\/(hostToGuest\/latest|guestToHost\/[A-Za-z0-9-]+|guestAcks\/[A-Za-z0-9-]+)$/

function validCode(value) { return /^[A-Z0-9]{6}$/.test(String(value || '').toUpperCase()) }

export default async function handler(request, response) {
  const code = String(request.query?.code || '').toUpperCase()
  const path = String(request.query?.path || '')
  if (!validCode(code) || !ALLOWED_PATH.test(path)) return response.status(400).json({ error: 'invalid relay path' })

  const target = `${DATABASE_URL}/rooms/${code}/${path}.json`
  try {
    if (request.method === 'GET') {
      const upstream = await fetch(target, { cache: 'no-store' })
      if (!upstream.ok) return response.status(502).json({ error: `firebase ${upstream.status}` })
      response.setHeader('Cache-Control', 'no-store, max-age=0')
      return response.status(200).json(await upstream.json())
    }
    if (request.method === 'PUT') {
      const body = JSON.stringify(request.body ?? null)
      if (body.length > 250000) return response.status(413).json({ error: 'payload too large' })
      const upstream = await fetch(target, { method: 'PUT', headers: { 'content-type': 'application/json' }, body })
      if (!upstream.ok) return response.status(502).json({ error: `firebase ${upstream.status}` })
      return response.status(200).json({ ok: true })
    }
    if (request.method === 'DELETE') {
      const upstream = await fetch(target, { method: 'DELETE' })
      if (!upstream.ok) return response.status(502).json({ error: `firebase ${upstream.status}` })
      return response.status(200).json({ ok: true })
    }
    response.setHeader('Allow', 'GET, PUT, DELETE')
    return response.status(405).json({ error: 'method not allowed' })
  } catch (error) {
    return response.status(503).json({ error: error?.message || 'relay unavailable' })
  }
}
