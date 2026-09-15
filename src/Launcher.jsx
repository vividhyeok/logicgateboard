import React from 'react'
import { motion } from 'framer-motion'

export default function Launcher() {
  return (
    <main className="launcher-page">
      <section className="launcher-card">
        <div className="launcher-brand"><span>LOGIC GATE DUEL</span><h1>어떻게 플레이할까요?</h1><p>친구와 각자 다른 기기에서 플레이하려면 온라인 2인을 선택하세요.</p></div>
        <div className="launcher-options">
          <motion.a className="launcher-option online" href="?online=1" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <span className="launcher-badge">추천</span>
            <strong>친구와 2인 온라인</strong>
            <p>연구실 ↔ 집처럼 서로 다른 장소에서도 가능</p>
            <ul><li>6자리 방 코드</li><li>초대 링크 공유</li><li>각자 자기 손패만 확인</li></ul>
            <b>온라인 방 만들기 / 입장하기 →</b>
          </motion.a>
          <motion.a className="launcher-option local" href="?local=1" whileHover={{y:-4}} whileTap={{scale:.985}}>
            <strong>혼자 / 같은 기기 테스트</strong>
            <p>CPU전이나 Pass & Play로 빠르게 규칙을 확인합니다.</p>
            <ul><li>VS CPU</li><li>한 화면 Pass & Play</li><li>플레이테스트 로그</li></ul>
            <b>로컬 테스트 열기 →</b>
          </motion.a>
        </div>
        <footer>ONLINE 2P에서는 상대 손패와 비밀 INPUT이 각 기기에서 서로 공개되지 않습니다.</footer>
      </section>
    </main>
  )
}
