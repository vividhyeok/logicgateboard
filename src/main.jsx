import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import OnlineApp from './OnlineApp.jsx'
import './base.css'
import './cards.css'
import './game.css'

const params = new URLSearchParams(window.location.search)
const onlineMode = params.get('online') === '1' || params.has('room')
const RootApp = onlineMode ? OnlineApp : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {!onlineMode && <a className="quick-online-entry" href="?online=1">ONLINE 2P</a>}
    <RootApp />
  </React.StrictMode>,
)
