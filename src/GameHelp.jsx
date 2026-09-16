import React, { useRef } from 'react'

export function GameHelp() {
  const dialog = useRef(null)
  return <>
    <button type="button" className="help-button" onClick={() => dialog.current.showModal()}>게임 방법</button>
    <dialog ref={dialog} className="help-dialog" aria-labelledby="help-title" onClick={event => { if (event.target === dialog.current) dialog.current.close() }}>
      <div className="help-heading"><h2 id="help-title">한 장씩 놓고, 결과를 바꾸세요.</h2><button aria-label="도움말 닫기" onClick={() => dialog.current.close()}>✕</button></div>
      <ol>
        <li><strong>목표는 0 또는 1.</strong> 마지막 OUT이 내 목표와 같으면 승리합니다.</li>
        <li><strong>내 입력은 비밀.</strong> 0·1을 눌러 배치하고 확정하세요. 확정 전까지 바꿀 수 있습니다.</li>
        <li><strong>한 차례에 카드 한 장.</strong> 카드를 고르고 빛나는 빈칸을 누르거나, 카드 자체를 드래그하세요. 앞뒤 순서는 자유입니다.</li>
        <li><strong>NOT·통과는 공유하는 한 쌍.</strong> 한쪽을 놓으면 반대쪽도 자동으로 채워집니다. 뒤집기 버튼으로 놓을 면을 고르세요.</li>
      </ol>
      <p>AND: 둘 다 1 · OR: 하나라도 1 · XOR: 서로 다르면 1<br/>NAND·NOR: AND·OR의 결과를 반전 · NOT: 0 ↔ 1</p>
      <p>모든 자리가 채워지면 신호가 흐르며 결과를 공개합니다. 플레이 중 상대 입력과 중간 결과는 숨겨집니다.</p>
      <form method="dialog"><button className="primary-button">알겠어요</button></form>
    </dialog>
  </>
}
