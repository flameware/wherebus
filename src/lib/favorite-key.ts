/**
 * 즐겨찾기 하나(정류장과 노선의 한 쌍)를 가리키는 키. 조회 결과(ArrivalResults)를 이 키로 찾습니다.
 */
export const getFavoriteKey = (nodeId: string, routeId: string) =>
  `${nodeId}-${routeId}`;
