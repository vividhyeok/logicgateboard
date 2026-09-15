# Logic Gate Duel — Digital Playtest Table

실물 **Logic Gate Duel**을 제작하기 전에 6개 회로 맵의 흐름, 카드 손맛, 선·후공 밸런스를 직접 확인하기 위한 웹 플레이테스트 버전입니다.

## 핵심

- Level 1/2의 6개 맵 구현
- 20장 Gate Deck: AND/NAND/OR/NOR/XOR 각 4장
- Level 1 손패 4장 / Level 2 손패 5장
- 양면 Wild: NOT / EMPTY
- VS CPU / 같은 기기 Pass & Play
- Firebase Realtime Database 기반 Online 2P 구조
- Online 2P에서는 상대 손패와 비밀 INPUT 비공개
- 카드 딜링 / Wild flip / 회로 신호 / 결과 애니메이션
- 브라우저 내 플레이테스트 기록 및 JSON 내보내기

## Stack

- React 18
- Vite 5
- Framer Motion
- Firebase Realtime Database — Online 2P 상태 중계
- Vercel — 웹 호스팅

## Firebase 준비

Online 2P는 Firebase 설정값이 없으면 비활성 상태입니다. `.env.example`의 변수를 채워야 합니다.

필요한 환경 변수:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

로컬에서는 `.env.example`을 `.env.local`로 복사한 뒤 값을 채웁니다.

Vercel에서는 Project Settings → Environment Variables에 같은 이름으로 등록한 뒤 Production 재배포가 필요합니다.

Realtime Database는 프로토타입 단계에서 먼저 Test mode로 생성할 수 있습니다. 외부 테스트가 끝나면 Database Rules를 제한하는 것을 권장합니다.

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

## Online 2P 구조

한쪽 브라우저가 Host가 되어 실제 게임 판정을 수행하고, Firebase RTDB는 두 기기 사이의 메시지와 접속 상태를 중계합니다.

```text
Host browser  ←→  Firebase RTDB  ←→  Guest browser
```

Host가 방 코드를 만들면 Guest가 같은 코드 또는 초대 링크로 입장합니다. 상대 손패와 비밀 INPUT은 각 플레이어용 snapshot에서 제거한 뒤 전송합니다.

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
