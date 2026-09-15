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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {onlineMode && <OnlineEnhancer />}
    <RootApp />
  </React.StrictMode>,
)
