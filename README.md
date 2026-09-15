# Logic Gate Duel — Digital Playtest Table

실물 **Logic Gate Duel**을 제작하기 전에 6개 회로 맵의 흐름, 카드 손맛, 선·후공 밸런스를 직접 확인하기 위한 웹 플레이테스트 버전입니다.

## 핵심

- Level 1/2의 6개 맵 구현
- 20장 Gate Deck: AND/NAND/OR/NOR/XOR 각 4장
- Level 1 손패 4장 / Level 2 손패 5장
- 양면 Wild: NOT / EMPTY
- 2P Pass & Play, VS CPU
- 비밀 INPUT 설정과 턴별 가림 화면
- 공개 손패, 카드 드래그 & 드롭, 슬롯 스냅
- 카드 딜링 / Wild flip / 회로 신호 / 결과 애니메이션
- 브라우저 내 플레이테스트 기록 및 JSON 내보내기
- Web Audio 기반 경량 효과음, 전체화면 지원

## Stack

- React 18
- Vite 5
- Framer Motion
- 별도 백엔드 없음

## Local

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
npm run preview
```

## Vercel

저장소를 Vercel에 Import하면 Vite 프로젝트로 자동 감지됩니다.

- Build Command: `npm run build`
- Output Directory: `dist`

## 플레이 규칙

1. 코인 토스로 목표 OUTPUT 선택권을 결정합니다.
2. 목표를 고른 플레이어의 상대가 선공입니다.
3. 각 플레이어는 자신에게 배정된 INPUT 값을 비밀리에 정합니다.
4. Gate Deck에서 번갈아 카드를 받아 손패를 구성합니다.
5. 매 턴 Gate 카드 또는 아직 쓰지 않은 Wild를 빈 슬롯 하나에 놓습니다.
6. 모든 슬롯이 채워지면 INPUT을 공개하고 회로를 실행합니다.
7. 최종 OUTPUT이 자신의 목표값과 같은 플레이어가 승리합니다.

## 디자인 방향

웹 UI가 실물 프로토타입의 감각을 최대한 반영하도록 구성했습니다. 보드는 오프화이트 인쇄물/접이식 보드 질감, 카드는 강한 단색과 큰 논리게이트 기호를 사용하는 대중적인 카드게임 문법으로 설계했습니다. 특정 상용 카드 디자인을 복제하지 않고 논리게이트 식별성을 우선합니다.
