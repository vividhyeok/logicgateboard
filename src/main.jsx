import React, { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import ReactDOM from 'react-dom/client'
const App = lazy(() => import('./App.jsx'))
const OnlineApp = lazy(() => import('./OnlineApp.jsx'))
import Launcher from './Launcher.jsx'
import './base.css'
import './cards.css'
import './gate-symbols.css'
import './game.css'
import './board-clarity.css'
import './launcher.css'
import './input-board.css'
import './input-card-motion.css'
import './game-feel.css'
import './setup-hand.css'
import './online.css'
import './online-polish.css'
import './experience.css'
import './tabletop.css'

const params = new URLSearchParams(window.location.search)
const onlineMode = params.get('online') === '1' || params.has('room') || params.has('host')
const localMode = params.get('local') === '1'
const RootApp = onlineMode ? OnlineApp : localMode ? App : Launcher

class GameErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Game screen error', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="online-lobby"><div className="lobby-card"><h2>화면을 복구해야 합니다.</h2><p>아래 버튼으로 화면을 다시 불러오세요. 혼자 하던 게임은 처음부터 시작합니다.</p><button className="online-primary" onClick={() => window.location.reload()}>게임 화면 다시 불러오기</button></div></main>
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameErrorBoundary>
      <MotionConfig reducedMotion="user"><Suspense fallback={<main className="loading-screen" role="status">게임 테이블을 준비하고 있어요…</main>}><RootApp /></Suspense></MotionConfig>
    </GameErrorBoundary>
  </React.StrictMode>,
)

