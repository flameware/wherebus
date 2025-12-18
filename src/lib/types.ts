/**
 * /getSttnAcctoArvlPrearngeInfoList 또는 /getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList
 * API의 응답 아이템 타입입니다.
 */
export interface BusArrivalInfo {
  arrprevstationcnt: number; // 남은 정류장 수
  arrtime: number; // 도착 예정 시간 (초)
  nodeid: string; // 정류소 ID
  nodenm: string; // 정류소명
  routeid: string; // 노선 ID
  routeno: string | number; // 노선 번호
  routetp: string; // 노선 유형 (예: "간선버스")
  vehicleno: string; // 차량 번호
}

/**
 * API 응답의 기본 구조
 */
export interface ApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T[] | T; // 아이템이 하나일 경우 객체, 여러개일 경우 배열일 수 있음
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}
