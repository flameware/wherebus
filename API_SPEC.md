# API_SPEC.md: 버스 정보 조회 서비스 명세서

본 문서는 **경기도 버스도착정보(GBIS)** 오픈 API와, 이를 감싸는 앱 내부 API(`/api/bus`)의 핵심 명세를 담고 있습니다.

> 이전에는 국토교통부(TAGO) 버스도착정보를 사용했으나, 도착 예정 시간이 실제보다 2~3분 이상 늦어 GBIS로 교체했습니다. 배경은 이슈 #1을 참고하세요.

## 1. 공통 설정

- **데이터 형식**: XML 및 JSON 지원 (요청 시 `format=json` 파라미터 필수)

- **인터페이스 표준**: REST (GET)

- **인증 방법**: `serviceKey` (공공데이터포털 발급 인증키, 서버 환경변수 `DATA_GO_KR_API_KEY`)

- **지원 범위**: 경기도 정류소/노선만 조회 가능

---

## 2. 경기도 버스도착정보 조회 서비스 (busarrivalservice v2)

- **Base URL**: `https://apis.data.go.kr/6410000/busarrivalservice/v2`

- **활용 신청**: 공공데이터포털 "경기도_버스도착정보 조회"

### 2.1. [사용 중] 버스도착정보항목 조회

특정 정류소에서 특정 노선의 가장 가까운 차량 2대의 도착 정보를 조회합니다.

- **Endpoint**: `/getBusArrivalItemv2`

- **주요 요청 변수**:

  - `stationId`: 정류소 ID (예: `206000199`)
  - `routeId`: 노선 ID (예: `204000022`)
  - `format`: `json`

- **주요 응답 항목** (`response.msgBody.busArrivalItem`):

  - `predictTime1`, `predictTime2`: **도착 예정 시간 (단위: 분)**
  - `locationNo1`, `locationNo2`: 남은 정류장 수
  - `plateNo1`, `plateNo2`: 차량 번호
  - `stationNm1`, `stationNm2`: 차량의 현재 위치 정류장명
  - `routeName`: 노선 번호
  - `routeDestName`: 노선 종점(방면)

- **주의**: 도착 예정 차량이 없는 칸은 숫자 대신 빈 문자열(`""`)로 내려옵니다. 출발 전 차량도 포함될 수 있습니다.

### 2.2. 결과 코드 (`response.msgHeader.resultCode`)

| 코드 | 의미 |
| :--- | :--- |
| 0 | 정상 처리 |
| 4 | 결과 없음 (정류소에 해당 노선이 없는 등 잘못된 조합) |

---

## 3. 앱 내부 API (`GET /api/bus`)

외부 API 키를 숨기기 위해 Route Handler(`src/app/api/bus/route.ts`)에서 GBIS를 호출하고 응답을 정리해 돌려줍니다.

- **요청 변수**: `nodeId`, `routeId`

  - `src/lib/favorites.json`의 TAGO 형식 ID(예: `GGB206000199`)를 그대로 받으며, 서버에서 `GGB` 접두사를 제거해 GBIS ID로 변환합니다.

- **응답**:

| 상태 | 본문 | 의미 |
| :--- | :--- | :--- |
| 200 | `{ routeName, routeDestName, arrivals: [...] }` | 정상. `arrivals`는 가까운 순 최대 2대 |
| 200 | `{ ..., arrivals: [] }` | 도착 예정 버스 없음 |
| 400 | `{ error }` | 요청 변수 누락 |
| 404 | `{ error }` | GBIS 결과 없음 (잘못된 ID 조합) |
| 500 | `{ error }` | 서버에 API 키 미설정 |
| 502 | `{ error }` | 외부 API 호출 실패 |

- `arrivals` 항목: `{ predictTime(분), locationNo, plateNo, stationNm }`

---

## 4. 정류소/노선 ID 찾기 (참고)

즐겨찾기에 추가할 ID는 TAGO 버스정류소정보(`https://apis.data.go.kr/1613000/BusSttnInfoInqireService`)의 `/getSttnNoList`(정류소명 검색)로 찾을 수 있습니다. 경기도 정류소는 `GGB` 접두사가 붙은 ID로 조회되며, 이 형식 그대로 `favorites.json`에 저장하면 됩니다.

- 이 서비스는 별도 활용 신청이 필요하며, 현재는 신청되어 있지 않습니다.

---

## 5. 공공데이터포털 게이트웨이 에러

인증·호출 한도 문제는 서비스와 관계없이 `OpenAPI_ServiceResponse.cmmMsgHeader`로 내려옵니다.

- **30**: 등록되지 않은 서비스키 (활용 신청 만료·해지 포함)

- **22**: 서비스 요청 제한 횟수 초과

---

### 개발 시 참고 사항

1.  **시간 단위**: GBIS의 `predictTime`은 **분** 단위로만 제공되므로 초 단위 표시는 불가능합니다.

2.  **노선 식별**: 즐겨찾는 버스는 `nodeId`와 `routeId` 쌍으로 `src/lib/favorites.json`에 저장합니다.

3.  **갱신**: 화면은 30초마다, 그리고 탭/앱으로 돌아왔을 때 다시 조회합니다. 즐겨찾기 수만큼 호출이 발생하므로 일일 트래픽 한도를 고려하세요.
