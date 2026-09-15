# Logic Gate Duel — Web Playtest

기존 Python/Pygame `Logic Gate Duel` 프로토타입의 핵심 규칙을 브라우저로 옮긴 **무의존성(static HTML/CSS/JS) 플레이테스트 버전**입니다.

## 포함된 것

- Level 1 / Level 2의 6개 맵 전체
- Gate Deck: AND / NAND / OR / NOR / XOR 각 4장, 총 20장
- Level 1 손패 4장 / Level 2 손패 5장
- 플레이어별 Wild 1장: NOT / EMPTY 양면 개념
- 동전 승자 목표 OUTPUT 선택, 패자는 선공
- 플레이어별 INPUT 위치 무작위 배정 + 비공개 0/1 선택
- 양쪽 Gate 손패와 배치 카드는 공개
- **2P Pass & Play**: 매 턴 화면 넘김 가림 화면 포함
- **VS CPU**: 혼자 규칙과 맵 흐름을 빠르게 확인하는 경량 Monte Carlo CPU
- 마지막 INPUT 공개 → 회로 신호가 순서대로 흐르는 애니메이션 → OUTPUT/승자 판정
- 브라우저 `localStorage`에 플레이테스트 결과 자동 저장
- 결과 화면에서 템포 / 체감 밸런스 / 메모 기록
- 메인 화면에서 전체 테스트 기록을 JSON으로 내보내기

## 디자인 방향

실물 제작 전 카드게임의 손맛을 확인하기 위한 버전입니다.

- UNO류 카드게임에서 느껴지는 **강한 단색, 큰 중앙 심볼, 모서리 라벨, 대각선 타원형 그래픽 문법**을 참고
- 특정 상표/로고를 복제하지 않고, **표준 논리게이트 기호 자체**를 카드의 핵심 그래픽으로 사용
- 맵은 기존 회로 배치를 유지하고, 실제 카드가 회로 슬롯에 올라가는 감각을 우선

## 로컬 실행

빌드가 필요 없습니다. 폴더를 정적 서버로 열면 됩니다.

```bash
python -m http.server 5173
```

그 뒤 `http://localhost:5173` 접속.

## Vercel

이 저장소를 Vercel에서 Import하면 됩니다.

- Framework Preset: **Other**
- Build Command: **비워두기**
- Output Directory: **비워두기**
- 환경 변수: 없음

`vercel.json`을 포함했고, 별도 서버/DB/API가 없습니다.

## 원본 Pygame에서 유지한 규칙

- Gate = 2-input / 1-output
- Wild = 1-input / 1-output
- Level 1 = Gate 3 + Wild 1 = 4 slots = 각 플레이어 2번 행동
- Level 2 = Gate 5 + Wild 1 = 6 slots = 각 플레이어 3번 행동
- shared Gate Deck을 P1 → P2 순서로 번갈아 배분
- Wild 사용도 한 턴을 완전히 소비
- 상대 INPUT만 카드 배치 종료 전까지 비공개

## CPU에 대해

웹 버전 CPU는 **빠른 실제 플레이테스트 편의용**입니다. 원본 Python의 Belief AI 전체를 1:1 포팅하지 않고, 상대 INPUT을 모르는 상태에서 가능한 값을 샘플링하여 후보 수를 Monte Carlo로 비교합니다. 실제 밸런스 판단은 `2P Pass & Play` 기록을 우선하는 것을 권장합니다.
