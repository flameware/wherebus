/**
 * 경기도 버스도착정보 v2 /getBusArrivalItemv2 API의 응답 아이템 타입입니다.
 * 버스가 없는 칸은 숫자 대신 빈 문자열("")로 내려옵니다.
 */
export interface GbisBusArrivalItem {
  routeId: number; // 노선 ID
  routeName: string | number; // 노선 번호
  routeDestName: string; // 노선 종점(방면)
  stationId: number; // 정류소 ID
  locationNo1: number | ""; // 첫 번째 차량의 남은 정류장 수
  locationNo2: number | "";
  predictTime1: number | ""; // 첫 번째 차량의 도착 예정 시간 (분)
  predictTime2: number | "";
  plateNo1: string; // 첫 번째 차량 번호
  plateNo2: string;
  stationNm1: string; // 첫 번째 차량의 현재 위치 정류장명
  stationNm2: string;
}

/**
 * GBIS API 응답의 기본 구조
 * resultCode: 0 정상, 4 결과 없음, 그 외 오류
 */
export interface GbisResponse<T> {
  response: {
    msgHeader: {
      queryTime: string;
      resultCode: number;
      resultMessage: string;
    };
    msgBody?: {
      busArrivalItem: T;
    };
  };
}

/**
 * 도착 예정 차량 한 대의 정보
 */
export interface BusArrival {
  predictTime: number; // 도착 예정 시간 (분)
  locationNo: number; // 남은 정류장 수
  plateNo: string; // 차량 번호
  stationNm: string; // 현재 위치 정류장명
}

/**
 * /api/bus 응답 타입. arrivals는 가까운 순으로 최대 2대이며, 비어 있으면 도착 예정 버스가 없는 상태입니다.
 */
export interface RouteArrival {
  routeName: string;
  routeDestName: string;
  arrivals: BusArrival[];
}

/**
 * 노선 유형. 유형마다 정해진 노선 색이 있습니다.
 */
export type RouteType = "직행좌석" | "좌석" | "일반" | "마을";

/**
 * 즐겨찾기 정류장 하나와, 그 정류장에서 지켜보는 노선들 (src/lib/favorites.json)
 */
export interface FavoriteStop {
  alias: string; // 사용자가 붙인 별칭 (예: 판교역)
  stopName: string; // 정식 정류장명 (예: 판교역동편)
  nodeId: string;
  routes: FavoriteRoute[];
}

export interface FavoriteRoute {
  routeId: string;
  routeName: string;
  routeType: RouteType;
}

/**
 * 즐겨찾기 노선 하나의 조회 결과. receivedAt은 값을 받은 시각(ms)입니다.
 * 조회에 실패하면 마지막으로 받은 값(last)을 함께 들고 있어, 흐리게라도 보여줄 수 있습니다.
 */
export type ArrivalResult =
  | { status: "ok"; data: RouteArrival; receivedAt: number }
  | { status: "error"; last?: { data: RouteArrival; receivedAt: number } };
