/**
 * 실행이 진행 중일 때 다시 부르면 새로 실행하지 않고 진행 중인 실행을 그대로 돌려줍니다.
 * 자동 갱신, 당겨서 새로고침, 버튼이 겹쳐도 조회가 한 번만 돌게 합니다.
 */
export function singleFlight(fn: () => Promise<void>): () => Promise<void> {
  let inFlight: Promise<void> | null = null;
  return () => {
    inFlight ??= fn().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
