# API 명세서

버스어딨니가 사용하는 외부 API(경기도 버스도착정보, GBIS)와, 이를 감싸는 앱 내부 API(`GET /api/bus`)의 명세입니다.
용어는 [`GLOSSARY.md`](./GLOSSARY.md)를, 요구사항은 [`PRD.md`](./PRD.md)를 따릅니다.

> 이전에는 국토교통부(TAGO) 버스도착정보를 사용했으나, 도착 예정 시간이 실제보다 2~3분 이상 늦어 GBIS로 교체했습니다. 배경은 이슈 #1을 참고하세요.

## 1. 앱 내부 API: `GET /api/bus`

화면은 외부 API를 직접 호출하지 않고 이 엔드포인트만 사용합니다. Route Handler(`src/app/api/bus/route.ts`)가 API 키를 숨긴 채 GBIS를 호출하고, 응답을 앱 타입(`src/lib/types.ts`의 `RouteArrival`)으로 정리해 돌려줍니다.

### 1.1. 요청

| 변수 | 필수 | 설명 |
| :--- | :--- | :--- |
| `nodeId` | 예 | 정류소 ID |
| `routeId` | 예 | 노선 ID |

- ID는 `src/lib/favorites.json`에 적힌 값을 그대로 넘깁니다.
- TAGO 형식(`GGB206000199`)과 GBIS 형식(`206000199`) 모두 받으며, 서버에서 `GGB` 접두사를 제거해 GBIS ID로 변환합니다.

### 1.2. 응답

| 상태 | 본문 | 의미 |
| :--- | :--- | :--- |
| 200 | `{ routeName, routeDestName, arrivals: [...] }` | 정상. `arrivals`는 가까운 순 최대 2대 |
| 200 | `{ ..., arrivals: [] }` | 도착 예정 버스 없음 |
| 400 | `{ error }` | `nodeId` 또는 `routeId` 누락 |
| 404 | `{ error }` | GBIS 결과 없음 (정류소에 해당 노선이 없는 등 잘못된 ID 조합) |
| 500 | `{ error }` | 서버에 API 키 미설정 |
| 502 | `{ error }` | GBIS 호출 실패 또는 알 수 없는 결과 코드 |

```json
{
  "routeName": "380",
  "routeDestName": "종점 방면",
  "arrivals": [
    {
      "predictTime": 5,
      "locationNo": 3,
      "plateNo": "경기70아1234",
      "stationNm": "현재 위치 정류장"
    }
  ]
}
```

| `arrivals[]` 필드 | 설명 |
| :--- | :--- |
| `predictTime` | 도착 예정 시간 (분). GBIS가 분 단위로만 주므로 초 단위 표시는 불가능합니다. |
| `locationNo` | 남은 정류장 수 |
| `plateNo` | 차량 번호 |
| `stationNm` | 차량이 지금 지나는 정류장명 |

GBIS 응답에서 차량이 없는 칸(`predictTime`·`locationNo`가 빈 문자열)은 걸러내고 `arrivals`에 넣지 않습니다.

### 1.3. 캐시와 호출 한도

- GBIS 일일 호출 한도는 10,000건입니다.
- 접속자 수와 관계없이 정류장·노선 조합마다 20초에 최대 1번만 GBIS를 호출하도록, 서버에서 `fetch`의 `next.revalidate`로 20초 동안 응답을 캐시합니다.
- 화면은 30초마다, 그리고 탭이나 앱으로 돌아왔을 때 다시 조회합니다. 즐겨찾기 노선 수만큼 호출이 발생합니다.

## 2. 외부 API: 경기도 버스도착정보 조회 (GBIS busarrivalservice v2)

- **Base URL**: `https://apis.data.go.kr/6410000/busarrivalservice/v2`
- **활용 신청**: 공공데이터포털(data.go.kr) "경기도_버스도착정보 조회"
- **인증**: `serviceKey` 쿼리 변수. 값은 서버 환경변수 `DATA_GO_KR_API_KEY`로 관리합니다.
- **형식**: REST (GET). XML과 JSON을 지원하며, JSON을 받으려면 `format=json`이 필수입니다.
- **지원 범위**: 경기도 정류소와 노선만 조회할 수 있습니다.

### 2.1. 버스도착정보항목 조회 `GET /getBusArrivalItemv2`

특정 정류소에서 특정 노선의 가장 가까운 차량 2대의 도착 정보를 조회합니다. 앱이 사용하는 유일한 엔드포인트입니다.

| 요청 변수 | 예시 | 설명 |
| :--- | :--- | :--- |
| `stationId` | `206000199` | 정류소 ID |
| `routeId` | `204000022` | 노선 ID |
| `format` | `json` | 응답 형식 |
| `serviceKey` | | 인증키 |

응답 본문은 `response.msgBody.busArrivalItem`이며, 타입은 `src/lib/types.ts`의 `GbisBusArrivalItem`입니다.

| 응답 항목 | 설명 |
| :--- | :--- |
| `routeName` | 노선 번호 (문자열 또는 숫자로 내려옵니다) |
| `routeDestName` | 노선 종점(방면) |
| `predictTime1`, `predictTime2` | 도착 예정 시간 (분) |
| `locationNo1`, `locationNo2` | 남은 정류장 수 |
| `plateNo1`, `plateNo2` | 차량 번호 |
| `stationNm1`, `stationNm2` | 차량의 현재 위치 정류장명 |

- 도착 예정 차량이 없는 칸은 숫자 대신 빈 문자열(`""`)로 내려옵니다.
- 출발 전 차량도 포함될 수 있습니다.

### 2.2. 결과 코드 `response.msgHeader.resultCode`

| 코드 | 의미 | 앱 처리 |
| :--- | :--- | :--- |
| 0 | 정상 처리 | 200 |
| 4 | 결과 없음 (정류소에 해당 노선이 없는 등 잘못된 조합) | 404 |
| 그 외 | 오류 | 502 |

### 2.3. 공공데이터포털 게이트웨이 에러

인증이나 호출 한도 문제는 서비스와 관계없이 `OpenAPI_ServiceResponse.cmmMsgHeader`로 내려옵니다. 앱은 이를 GBIS 호출 실패(502)로 처리합니다.

| 코드 | 의미 |
| :--- | :--- |
| 22 | 서비스 요청 제한 횟수 초과 |
| 30 | 등록되지 않은 서비스키 (활용 신청 만료·해지 포함) |

## 3. 정류소·노선 ID 찾기 (참고)

즐겨찾기에 추가할 ID는 TAGO 버스정류소정보 서비스(`https://apis.data.go.kr/1613000/BusSttnInfoInqireService`)의 `/getSttnNoList`로 정류소명을 검색해 찾을 수 있습니다. 경기도 정류소는 `GGB` 접두사가 붙은 ID로 조회되며, 이 형식 그대로 `favorites.json`에 저장하면 됩니다.

- 이 서비스는 별도 활용 신청이 필요하며, 현재는 신청되어 있지 않습니다.
- GBIS의 정류소·노선 조회 서비스를 통해서도 찾을 수 있습니다.
