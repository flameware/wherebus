# API_SPEC.md: 버스 정보 조회 서비스 명세서

본 문서는 **국토교통부(TAGO)**에서 제공하는 버스 도착 및 정류소 정보 오픈 API 명세의 핵심 내용을 담고 있습니다.

## 1. 공통 설정

- **데이터 형식**: XML 및 JSON 지원 (요청 시 `_type=json` 파라미터 권장)

- **인터페이스 표준**: REST (GET)

- **인증 방법**: `serviceKey` (공공데이터포털 발급 인증키)

- **데이터 갱신 주기**: 실시간 (약 10~20초 단위)

---

## 2. 버스 도착 정보 조회 서비스 (ArvlInfoInqireService)

정류소를 기준으로 현재 운행 중인 버스의 도착 예정 정보를 조회합니다.

- **Base URL**: `http://apis.data.go.kr/1613000/ArvlInfoInqireService`

### 2.1. [필수] 정류소별 도착 예정 정보 목록 조회

특정 정류소에 도착 예정인 모든 버스 목록을 가져옵니다.

- **Endpoint**: `/getSttnAcctoArvlPrearngeInfoList`

- **주요 요청 변수**:

- `cityCode`: 도시코드 (예: 대전 25)

- `nodeId`: 정류소 ID (예: DJB8001793)

- **주요 응답 항목**:

- `arrtime`: **도착 예정 시간 (단위: 초)**

- `arrprevstationcnt`: 남은 정류장 수

- `routeno`: 노선 번호

- `routeid`: 노선 ID

### 2.2. 정류소별 특정 노선버스 도착 예정 정보 목록 조회

특정 정류소에서 내가 기다리는 특정 버스 노선의 정보만 조회합니다.

- **Endpoint**: `/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList`

- **추가 요청 변수**: `routeId` (노선 ID)

---

## 3. 버스 정류소 정보 조회 서비스 (BusSttnInfoInqireService)

정류소 이름이나 위치를 기준으로 정류소 ID 및 고유 번호를 조회합니다.

- **Base URL**: `http://apis.data.go.kr/1613000/BusSttnInfoInqireService`

### 3.1. 정류소 번호 목록 조회 (검색용)

사용자가 정류소 명칭으로 정류소를 찾을 때 사용합니다.

- **Endpoint**: `/getSttnNoList`

- **주요 요청 변수**: `nodeNm` (정류소명), `cityCode`

- **주요 응답 항목**: `nodeid` (도착 정보 조회 시 필수 키), `nodenm`, `nodeno`

### 3.2. 좌표 기반 근접 정류소 목록 조회

사용자의 현재 위치(GPS)를 기반으로 반경 500m 이내의 정류소를 찾습니다.

- **Endpoint**: `/getCrdntPrxmtSttnList`

- **주요 요청 변수**: `gpsLati` (위도), `gpsLong` (경도)

---

4. 도시 코드 (cityCode) 참조

조회 시 필수 파라미터인 `cityCode`의 예시는 다음과 같습니다:
| 도시명 | 코드 |
| :--- | :--- |
| 대구광역시 | 22 |
| 대전광역시 | 25 |

참고: `/getCtyCodeList` 기능을 통해 전체 목록을 동적으로 가져올 수 있습니다.

---

5. 에러 코드 관리

API 호출 실패 시 다음 코드를 확인하여 예외 처리를 수행합니다.

- **30**: 등록되지 않은 서비스키 (인증키 오류)

- **22**: 서비스 요청 제한 횟수 초과

- **99**: 잘못된 요청 파라미터 (제공기관 에러)

---

### 개발 시 참고 사항 (Gemini-CLI 지침)

1.  **시간 변환**: `arrtime`은 **초(second)** 단위로 전달되므로, UI 상에는 `Math.floor(arrtime / 60)`을 통해 **분** 단위로 표시하세요.

2.  **노선 식별**: 사용자가 즐겨찾는 버스를 저장할 때는 `nodeId`와 `routeId` 쌍을 로컬 스토리지에 보관해야 정확한 조회가 가능합니다.

3.  **데이터 형식**: 응답 메시지 예제를 참고하여 XML 파싱 로직을 구현하거나, 요청 시 반드시 `_type=json`을 포함하여 JSON 객체로 처리하세요.

---
