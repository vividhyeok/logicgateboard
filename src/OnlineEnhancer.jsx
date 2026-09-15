import { useEffect } from 'react'
import './online-enhancer.css'

function makeInvite(roomCode) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('online','1')
  url.searchParams.set('room',roomCode)
  const link = url.toString()
  return {
    link,
    message: `LOGIC GATE DUEL 같이 하자!\n방 코드: ${roomCode}\n${link}\n링크를 열면 바로 방에 들어올 수 있어.`,
  }
}

function showToast(text) {
  const old = document.querySelector('.enhancer-share-toast')
  old?.remove()
  const toast = document.createElement('div')
  toast.className = 'enhancer-share-toast'
  toast.textContent = text
  document.body.appendChild(toast)
  window.setTimeout(()=>toast.remove(),1800)
}

export default function OnlineEnhancer() {
  useEffect(() => {
    const syncLabels = () => {
      document.querySelectorAll('.copy-invite').forEach((button) => {
        if (button.dataset.enhanced === '1') return
        button.dataset.enhanced = '1'
        button.textContent = '친구에게 공유하기'
      })
    }
    syncLabels()
    const observer = new MutationObserver(syncLabels)
    observer.observe(document.body,{childList:true,subtree:true})

    const onClick = async (event) => {
      const button = event.target.closest?.('.copy-invite')
      if (!button) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation?.()
      const code = document.querySelector('.lobby-card h1')?.textContent?.trim()?.toUpperCase()
      if (!code) return
      const { link, message } = makeInvite(code)
      try {
        await navigator.clipboard.writeText(message)
        showToast('초대 문구가 복사됐어요 · 카톡/DM에 붙여넣으세요')
      } catch {
        showToast('복사에 실패했어요 · 방 코드를 직접 보내주세요')
      }
      if (navigator.share) {
        try {
          await navigator.share({ title:'LOGIC GATE DUEL', text:`LOGIC GATE DUEL 같이 하자!\n방 코드: ${code}`, url:link })
        } catch {}
      }
    }
    document.addEventListener('click',onClick,true)
    return () => { observer.disconnect(); document.removeEventListener('click',onClick,true) }
  },[])
  return null
}
