# 버스어딨니

자주 타는 버스가 자주 가는 정류장에 언제 오는지 한눈에 보여주는 개인용 실시간 도착 정보 앱입니다.
경기도 버스도착정보(GBIS) 오픈 API를 사용하며, 모바일 홈 화면에 추가해 쓰는 PWA 형태로 만들었습니다.

## 주요 기능

- **즐겨찾기 정류장·노선만 표시**: 복잡한 버스 앱 대신 내가 보는 정류장과 노선만 카드로 보여줍니다.
- **도착 예정 차량 2대**: 노선마다 가까운 순으로 최대 두 대의 남은 시간, 남은 정류장 수, 현재 위치를 표시합니다.
- **우선 시간대**: 정류장에 시간대(예: 출근 08~10시)를 지정하면 그 시간에 해당 정류장이 맨 위로 올라옵니다.
- **자동 갱신**: 30초마다 자동으로 새로 받고, 당겨서 새로고침도 지원합니다. 화면이 숨겨지면 갱신을 멈추고 다시 보이면 재개합니다.
- **상태 표시**: 2분 이하는 "곧 도착"으로 강조, 15분 이상은 흐리게 표시합니다. 갱신에 실패하면 마지막 값을 흐리게 유지하고, 60초 이상 지난 데이터는 오래됐다고 알립니다.
- **노선 유형 색**: 직행좌석, 좌석, 일반, 마을 노선을 정해진 색의 배지로 구분합니다.
- **PWA**: 웹 앱 매니페스트와 아이콘을 포함해 홈 화면에 독립 앱처럼 설치할 수 있습니다.

## 기술 스택

- Next.js 16 (App Router, Route Handlers), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, Lucide React
- 데이터: 공공데이터포털 "경기도_버스도착정보 조회" (GBIS busarrivalservice v2)

## 시작하기

### 1. API 키 발급

[공공데이터포털](https://www.data.go.kr)에서 **경기도_버스도착정보 조회** 서비스 활용 신청을 하고 인증키를 받습니다.
경기도 정류소와 노선만 조회할 수 있습니다.

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 키를 넣습니다. 이 키는 서버(Route Handler)에서만 사용되며 브라우저에 노출되지 않습니다.

```bash
DATA_GO_KR_API_KEY=발급받은_인증키
```

### 3. 즐겨찾기 설정

`src/lib/favorites.json`에 지켜볼 정류장과 노선을 적습니다. 앱 안에서 편집하는 기능은 없고, 이 파일이 설정의 전부입니다.

```json
[
  {
    "alias": "판교역",
    "stopName": "판교역동편",
    "priorityHours": [8, 10],
    "nodeId": "GGB206000637",
    "routes": [
      { "routeId": "GGB204000079", "routeName": "380", "routeType": "일반" }
    ]
  }
]
```

| 필드 | 설명 |
| :--- | :--- |
| `alias` | 내가 부르는 짧은 이름. 카드 헤더에 `별칭 · 정식 정류장명` 형식으로 표시됩니다. |
| `stopName` | 정식 정류장명 |
| `priorityHours` | 선택. `[시작 시, 끝 시)` 범위. 이 시간에는 맨 위에 표시되며, `[22, 2]`처럼 자정을 넘길 수 있습니다. |
| `nodeId` | 정류소 ID. `GGB` 접두어가 붙은 TAGO 형식과 숫자만 있는 GBIS 형식 모두 사용할 수 있습니다. |
| `routes[].routeId` | 노선 ID. `nodeId`와 같은 규칙입니다. |
| `routes[].routeName` | 노선 번호 (예: `380`) |
| `routes[].routeType` | `직행좌석`, `좌석`, `일반`, `마을` 중 하나. 배지 색을 정합니다. |

정류소 ID와 노선 ID는 GBIS 정류소·노선 조회 API나 공공데이터포털의 참고 문서로 찾을 수 있습니다.

### 4. 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

| 명령 | 설명 |
| :--- | :--- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx            # 메인 화면: 즐겨찾기 조회, 자동 갱신, 정류장 정렬
│   ├── layout.tsx
│   ├── manifest.ts         # PWA 매니페스트
│   ├── icon.tsx, apple-icon.tsx
│   └── api/bus/route.ts    # GBIS를 호출해 응답을 정리하는 내부 API
├── components/
│   ├── arrival-track.tsx   # 남은 정류장 수를 트랙 위에 그리는 컴포넌트
│   └── ui/                 # shadcn/ui 컴포넌트
├── hooks/
│   └── use-pull-to-refresh.ts
└── lib/
    ├── favorites.json      # 즐겨찾기 설정 (사용자가 직접 편집)
    ├── types.ts            # GBIS 응답 및 앱 내부 타입
    ├── stop-order.ts       # 우선 시간대 기준 정류장 정렬
    ├── arrival-display.ts  # 곧 도착/흐림/오래됨 기준값과 노선 색
    └── app-icon.tsx
```

## 내부 API

`GET /api/bus?nodeId=<정류소 ID>&routeId=<노선 ID>`

Route Handler가 GBIS의 `getBusArrivalItemv2`를 호출하고, 차량이 없는 칸(빈 문자열)을 걸러낸 뒤 아래 형태로 돌려줍니다.
일일 호출 한도(10,000건)를 지키기 위해 정류장·노선 조합마다 20초 동안 응답을 캐시합니다.

```json
{
  "routeName": "380",
  "routeDestName": "종점 방면",
  "arrivals": [
    { "predictTime": 5, "locationNo": 3, "plateNo": "경기70아1234", "stationNm": "현재 위치 정류장" }
  ]
}
```

| 상태 | 의미 |
| :--- | :--- |
| 400 | `nodeId` 또는 `routeId` 누락 |
| 404 | 결과 없음 (정류소에 해당 노선이 없는 등) |
| 500 | 서버에 API 키가 설정되지 않음 |
| 502 | GBIS 호출 실패 |

자세한 내용은 [`API_SPEC.md`](./API_SPEC.md)를 참고하세요.

## 문서

- [`GLOSSARY.md`](./GLOSSARY.md): 정류장, 별칭, 우선 시간대 등 프로젝트 용어 정의
- [`PRD.md`](./PRD.md): 제품 요구사항
- [`API_SPEC.md`](./API_SPEC.md): GBIS 오픈 API와 내부 API 명세
- [`docs/design/mobbin-review.md`](./docs/design/mobbin-review.md): 디자인 리뷰와 개선 방향
- [`docs/agents/`](./docs/agents/): 이슈 트래커, 트리아지 라벨 등 에이전트 작업 규칙

## 배포

Next.js 앱이므로 [Vercel](https://vercel.com)에 바로 배포할 수 있습니다. 배포 환경에도 `DATA_GO_KR_API_KEY` 환경 변수를 설정해야 합니다.
