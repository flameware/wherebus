import { palette } from "@flameware/tokens";
import { BusArrival, RouteType } from "@/lib/types";

// 이 분 이하로 남으면 "곧 도착"으로 강조합니다.
export const IMMINENT_MINUTES = 2;

// 이 분 이상 남은 차량은 흐리게 표시합니다.
export const FAR_MINUTES = 15;

// 마지막 갱신 후 이 시간이 지나면 데이터가 오래됐다고 표시합니다 (자동 갱신 주기의 2배).
export const STALE_SECONDS = 60;

// 트랙에 그리는 최대 정거장 수. 이보다 멀리 있는 차량은 트랙 왼쪽 끝에 둡니다.
export const TRACK_STOPS = 10;

// 트랙 위 두 차량이 이 정거장 수 이하로 붙어 있으면 라벨이 겹치므로 다음 차의 라벨을 숨깁니다.
export const LABEL_GAP_STOPS = 2;

export const ROUTE_COLORS: Record<RouteType, string> = {
  직행좌석: "#E60012",
  좌석: "#0068B7",
  일반: "#00A05A",
  마을: "#F2A900",
};

/**
 * 노선 번호 배지의 배경/글자 색. 배경은 노선 색 그대로이고, 밝은 마을 노란색 위에만 검정 글자를 씁니다.
 */
export const routeBadgeColors = (routeType: RouteType) => ({
  background: ROUTE_COLORS[routeType],
  foreground: routeType === "마을" ? palette["base.black"] : palette["base.white"],
});

/**
 * 받은 뒤 흐른 시간만큼 줄어든 남은 분. GBIS 값이 분 단위라서 초 단위로는 줄이지 않습니다.
 */
export const minutesLeft = (
  arrival: BusArrival,
  receivedAt: number,
  now: number,
) =>
  Math.max(0, arrival.predictTime - Math.floor((now - receivedAt) / 60_000));

/** 도착 예정 차량의 순번. 즐겨찾기마다 가까운 순으로 최대 두 대입니다. */
export type ArrivalOrder = "first" | "second";

/**
 * 트랙에서 차량을 얼마나 강조할지. 곧 도착한 첫 차만 강조하고, 먼 첫 차와 두 번째 차는 흐리게 둡니다.
 */
export type ArrivalEmphasis = "imminent" | "normal" | "far" | "secondary";

export const arrivalEmphasis = (
  minutes: number,
  order: ArrivalOrder,
): ArrivalEmphasis => {
  if (order === "second") return "secondary";
  if (minutes <= IMMINENT_MINUTES) return "imminent";
  if (minutes >= FAR_MINUTES) return "far";
  return "normal";
};

export const formatMinutes = (minutes: number) =>
  minutes <= IMMINENT_MINUTES ? "곧 도착" : `${minutes}분`;

export const formatAgo = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return seconds < 60 ? `${seconds}초 전` : `${Math.floor(seconds / 60)}분 전`;
};
