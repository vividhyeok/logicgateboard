let ctx = null
let enabled = true

function context() {
  if (!enabled) return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function noiseBurst(audio, duration = 0.045, gainValue = 0.025, highpass = 900) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration))
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const source = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  filter.type = 'highpass'; filter.frequency.value = highpass
  gain.gain.setValueAtTime(gainValue, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  source.buffer = buffer
  source.connect(filter).connect(gain).connect(audio.destination)
  source.start()
}

function tone(audio, frequency, duration, gainValue = 0.025, type = 'sine', delay = 0) {
  const oscillator = audio.createOscillator(); const gain = audio.createGain()
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime + delay)
  gain.gain.setValueAtTime(gainValue, audio.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration)
  oscillator.connect(gain).connect(audio.destination)
  oscillator.start(audio.currentTime + delay); oscillator.stop(audio.currentTime + delay + duration)
}

export function setSoundEnabled(value) { enabled = value }
export function sound(name, payload = {}) {
  const audio = context(); if (!audio) return
  if (name === 'deal') { noiseBurst(audio, 0.045, 0.018, 1200); tone(audio, 210 + Math.random() * 50, 0.04, 0.008, 'triangle'); return }
  if (name === 'place') { noiseBurst(audio, 0.055, 0.026, 500); tone(audio, 125, 0.07, 0.018, 'triangle'); return }
  if (name === 'flip') { noiseBurst(audio, 0.03, 0.016, 1500); tone(audio, 380, 0.035, 0.008, 'square'); return }
  if (name === 'signal') { tone(audio, payload.value ? 620 : 360, 0.09, 0.018, 'sine'); return }
  if (name === 'turn') { tone(audio, 260, 0.06, 0.012, 'triangle'); tone(audio, 330, 0.06, 0.009, 'triangle', 0.045); return }
  if (name === 'win') [440, 554, 659].forEach((frequency, index) => tone(audio, frequency, 0.38, 0.022, 'sine', index * 0.075))
}
