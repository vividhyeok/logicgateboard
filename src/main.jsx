import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import OnlineApp from './OnlineApp.jsx'
import Launcher from './Launcher.jsx'
import OnlineEnhancer from './OnlineEnhancer.jsx'
import './base.css'
import './cards.css'
import './gate-symbols.css'
import './game.css'
import './launcher.css'

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
    return <main className="online-lobby"><div className="lobby-card"><h2>화면을 복구해야 합니다.</h2><p>방과 게임 상태는 유지됩니다. 아래 버튼을 눌러 최신 상태를 다시 불러오세요.</p><button className="online-primary" onClick={() => window.location.reload()}>게임 화면 다시 불러오기</button></div></main>
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameErrorBoundary>
      {onlineMode && <OnlineEnhancer />}
      <RootApp />
    </GameErrorBoundary>
  </React.StrictMode>,
)
