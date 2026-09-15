import React from 'react'
import { motion } from 'framer-motion'

export default function Launcher() {
  return (
    <main className="launcher-page">
      <section className="launcher-card">
        <div className="launcher-brand"><h1>플레이 방식</h1></div>
        <div className="launcher-options">
          <motion.a className="launcher-option online" href="?online=1" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <strong>친구와 하기</strong>
            <b>방 만들기 · 참가하기 →</b>
          </motion.a>
          <motion.a className="launcher-option local" href="?local=1&mode=cpu" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <strong>혼자 하기</strong>
            <b>맵 선택하기 →</b>
          </motion.a>
        </div>
      </section>
    </main>
  )
}
