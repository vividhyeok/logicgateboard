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
2. 목표를 고른 플레이어의 상대가 먼저 카드를 놓습니다.
3. 맵의 INPUT 위치와 각 플레이어가 담당할 INPUT은 모두 공개됩니다. 실제 0/1 값만 비밀리에 정합니다.
4. Gate Deck에서 번갈아 카드를 받아 손패를 구성합니다.
5. 첫 턴부터 모든 빈칸을 자유롭게 선택합니다. 게이트는 사각 자리, NOT·통과는 연결된 두 자리에 놓습니다.
6. 한 수씩 번갈아 놓습니다. 앞쪽부터 채울 의무나 단계별 선점 제한은 없습니다.
7. Wild 두 칸은 한 쌍입니다. 한쪽을 NOT으로 정하면 반대쪽은 자동 PASS가 되고, PASS 쪽을 선택하면 반대쪽이 NOT이 됩니다. 한 판에 한 쌍만 결정됩니다.
8. 모든 플레이어 배치는 공개되지만 중간 신호값과 상대 INPUT 값은 게임 종료 전까지 공개하지 않습니다.
9. 마지막 결과는 플레이어가 놓는 단일 카드가 직접 결정하지 않습니다. 각 맵의 두 후반 경로가 보드에 인쇄된 고정 XOR에서 합쳐진 뒤 OUT이 결정됩니다.
10. 최종 OUTPUT이 자신의 목표값과 같은 플레이어가 승리합니다.

## 전략 의도

초보자는 자신의 INPUT과 진리표만 보고 카드를 놓을 수 있습니다. 익숙해질수록 상대가 공개한 게이트 종류와 위치를 통해 상대 INPUT을 추론하고, 전체 덱이 각 게이트 4장이라는 사실을 이용해 남은 패를 카운팅할 수 있습니다. 반대로 자신의 INPUT과 다른 의도를 암시하는 카드를 놓아 상대의 추론을 흐리는 블러핑도 가능합니다.

웹 버전의 선택형 `카드 도움말`는 규칙 확인용 보조 기능일 뿐, 현재 보드의 결과를 자동 계산해 주지는 않습니다.

## 맵 설계 원칙

- 규칙은 모든 맵에서 동일합니다.
- 맵마다 달라지는 것은 신호 경로와 입력 재사용 방식뿐입니다.
- 구조는 비대칭이어도 두 플레이어의 영향력은 비슷하도록 설계합니다.
- 하나의 플레이어 제어 슬롯이 OUT을 단독 지배하지 않도록 두 후반 경로를 유지합니다.
- 같은 INPUT이 여러 위치에서 다시 등장해 한 번의 행동이 아니라 여러 턴의 행동을 함께 보고 추론하게 만듭니다.


## 2026-09-16 플레이 피드백 반영

- 입력 준비도 카드 선택 → 배정된 보드 자리 클릭 → 확정 순서로 진행합니다. 확정 전에는 회수하거나 교체할 수 있습니다.
- 초반부터 후반 자리 선점이 가능합니다. 1단계/2단계 배치 잠금과 단계별 선공 변경을 제거했습니다.
- 난이도 1의 NOT·통과 쌍은 최종 XOR 앞에서 중간 게이트 앞으로 이동했습니다. 최종 XOR의 어느 입력을 반전해도 동일해지던 선택을 없앴습니다.
- NOT·통과는 두 자리 중 한 곳을 결정하면 반대 면이 자동 배치됩니다. 턴 패스 기능이 아닙니다. 선택 중 뒤집은 면과 실제 액션을 동기화합니다.
- 카드 도움말은 기기에서 켜고 끌 수 있습니다. 계산 애니메이션 뒤에도 보드를 다시 볼 수 있습니다.
- CPU는 상대의 실제 입력/패를 읽지 않고 가능한 패와 입력을 샘플링합니다.
- 상대에게 보내는 상태에서 셔플 시드와 남은 덱 내용도 숨깁니다. 호스트가 판정하는 친구 간 대전 구조이며, 신뢰할 수 없는 호스트까지 막는 서버 판정 방식은 아닙니다.

검증: `node --test tests/game.test.js`, `npm run build`. 승률 균형은 실제 대전 데이터를 더 모아 확인해야 합니다.
