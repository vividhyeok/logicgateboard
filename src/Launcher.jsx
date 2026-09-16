import React from 'react'
import { motion } from 'framer-motion'

export default function Launcher() {
  return (
    <main className="launcher-page">
      <section className="launcher-card">
        <div className="launcher-brand"><span>LOGIC GATE DUEL</span><h1>한 장의 선택, 달라지는 결과.</h1><p>비밀 입력과 논리 카드로 겨루는 두 사람의 보드게임.</p></div>
        <div className="launcher-options">
          <motion.a className="launcher-option online" href="?online=1" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <strong>친구와 하기</strong><p>각자의 화면에서 비밀을 지키며 겨뤄보세요.</p>
            <b>방 만들기 · 참가하기 →</b>
          </motion.a>
          <motion.a className="launcher-option local" href="?local=1&mode=cpu" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <strong>혼자 하기</strong><p>CPU와 한 판. 원하는 맵에서 바로 시작하세요.</p>
            <b>맵 선택하기 →</b>
          </motion.a>
        </div>
      </section>
    </main>
  )
}
