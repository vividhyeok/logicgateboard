# Logic Gate Duel — Digital Playtest Table

실물 **Logic Gate Duel**을 제작하기 전에 6개 회로 맵의 흐름, 카드 손맛, 선·후공 밸런스를 직접 확인하기 위한 웹 플레이테스트 버전입니다.

## 핵심

- Level 1/2의 6개 맵 구현
- 20장 Gate Deck: AND/NAND/OR/NOR/XOR 각 4장
- Level 1 손패 4장 / Level 2 손패 5장
- 숨은 INPUT과 공개된 카드 배치를 이용한 추론·블러핑
- 두 경로가 연결된 공유 Wild: 한쪽 NOT / 반대쪽 PASS
- VS CPU / 같은 기기 Pass & Play
- Firebase Realtime Database 기반 Online 2P 구조
- Online 2P에서는 상대 손패와 비밀 INPUT 값 비공개
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

상대 손패와 비밀 INPUT **값**은 각 플레이어용 snapshot에서 제거합니다. INPUT A/B/C/D의 위치와 어느 플레이어 소유인지는 양쪽에 공개됩니다.

## 공통 플레이 규칙

맵마다 별도 특수 규칙을 두지 않고 아래 규칙을 모든 맵에 동일하게 적용합니다.

1. 코인 토스로 목표 OUTPUT 선택권을 결정합니다.
2. 목표를 고른 플레이어의 상대가 1단계를 먼저 시작합니다.
3. 맵의 INPUT 위치와 각 플레이어가 담당할 INPUT은 모두 공개됩니다. 실제 0/1 값만 비밀리에 정합니다.
4. Gate Deck에서 번갈아 카드를 받아 손패를 구성합니다.
5. 보드의 슬롯은 `1 → 2 → 3` 단계 순서로만 진행합니다. 현재 단계 안에서는 원하는 빈 슬롯을 선택할 수 있습니다.
6. 한 단계가 끝나면 다음 단계의 선 플레이어가 바뀝니다. 따라서 한 플레이어가 모든 중요 슬롯의 선점권을 가지지 않습니다.
7. Wild 두 칸은 한 쌍입니다. 한쪽을 NOT으로 정하면 반대쪽은 자동 PASS가 되고, PASS 쪽을 선택하면 반대쪽이 NOT이 됩니다. 한 판에 한 쌍만 결정됩니다.
8. 모든 플레이어 배치는 공개되지만 중간 신호값과 상대 INPUT 값은 게임 종료 전까지 공개하지 않습니다.
9. 마지막 결과는 플레이어가 놓는 단일 카드가 직접 결정하지 않습니다. 각 맵의 두 후반 경로가 보드에 인쇄된 고정 XOR에서 합쳐진 뒤 OUT이 결정됩니다.
10. 최종 OUTPUT이 자신의 목표값과 같은 플레이어가 승리합니다.

## 전략 의도

초보자는 자신의 INPUT과 진리표만 보고 카드를 놓을 수 있습니다. 익숙해질수록 상대가 공개한 게이트 종류와 위치를 통해 상대 INPUT을 추론하고, 전체 덱이 각 게이트 4장이라는 사실을 이용해 남은 패를 카운팅할 수 있습니다. 반대로 자신의 INPUT과 다른 의도를 암시하는 카드를 놓아 상대의 추론을 흐리는 블러핑도 가능합니다.

웹 버전의 `게이트 진리표`는 규칙 확인용 보조 기능일 뿐, 현재 보드의 결과를 자동 계산해 주지는 않습니다.

## 맵 설계 원칙

- 규칙은 모든 맵에서 동일합니다.
- 맵마다 달라지는 것은 신호 경로와 입력 재사용 방식뿐입니다.
- 구조는 비대칭이어도 두 플레이어의 영향력은 비슷하도록 설계합니다.
- 하나의 플레이어 제어 슬롯이 OUT을 단독 지배하지 않도록 두 후반 경로를 유지합니다.
- 같은 INPUT이 여러 위치에서 다시 등장해 한 번의 행동이 아니라 여러 턴의 행동을 함께 보고 추론하게 만듭니다.
