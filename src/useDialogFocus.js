import { useEffect, useRef } from 'react'

export function useDialogFocus(active = true) {
  const ref = useRef(null)
  useEffect(() => {
    if (!active || !ref.current) return
    const dialog = ref.current
    const previous = document.activeElement
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')]
    focusable()[0]?.focus({ preventScroll: true })
    const trap = event => {
      if (event.key !== 'Tab') return
      const items = focusable(), first = items[0], last = items.at(-1)
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [active])
  return ref
}
