import { BusArrival, RouteType } from "@/lib/types";

// 이 분 이하로 남으면 "곧 도착"으로 강조합니다.
export const IMMINENT_MINUTES = 2;

// 이 분 이상 남은 차량은 흐리게 표시합니다.
export const FAR_MINUTES = 15;

// 마지막 갱신 후 이 시간이 지나면 데이터가 오래됐다고 표시합니다 (자동 갱신 주기의 2배).
export const STALE_SECONDS = 60;

// 정거장 칸의 칸 수. 이보다 멀리 있는 차량은 왼쪽 첫 칸에 둡니다.
export const TRACK_STOPS = 10;

/**
 * 남은 정류장 수를 정거장 칸 인덱스(0~9)로 바꿉니다. 0번 칸이 10정거장 전(왼쪽 끝)이고,
 * 9번 칸이 내 정류장 바로 앞입니다. 진입 중(0정거장)인 차도 9번 칸에 둡니다.
 */
export const trackCellIndex = (locationNo: number) =>
  TRACK_STOPS - Math.min(Math.max(locationNo, 1), TRACK_STOPS);

export const ROUTE_COLORS: Record<RouteType, string> = {
  직행좌석: "#E60012",
  좌석: "#0068B7",
  일반: "#00A05A",
  마을: "#F2A900",
};

// 노선 번호 글자색. 노선 색 위에 쓰므로 앱 토큰(tt-ink)이 아니라 순수 검정·흰색입니다.
const NUMBER_BLACK = "#000000";
const NUMBER_WHITE = "#ffffff";

/**
 * 노선 칸의 배경/글자 색. 배경은 노선 색 그대로이고, 밝은 마을 노란색 위에만 검정 글자를 씁니다.
 */
export const routeCellColors = (routeType: RouteType) => ({
  background: ROUTE_COLORS[routeType],
  foreground: routeType === "마을" ? NUMBER_BLACK : NUMBER_WHITE,
});

/**
 * 노선명을 번호와 괄호 속 보조 표기로 나눕니다. 예: "1007(예약)" → { number: "1007", suffix: "예약" }.
 * 노선 칸에는 번호를 크게 쓰고 보조 표기는 그 아래에 작게 씁니다.
 */
export const splitRouteName = (
  routeName: string,
): { number: string; suffix?: string } => {
  const match = /^(.*?)\((.+)\)$/.exec(routeName);
  return match ? { number: match[1], suffix: match[2] } : { number: routeName };
};

/**
 * 받은 뒤 흐른 시간만큼 줄어든 남은 분. GBIS 값이 분 단위라서 초 단위로는 줄이지 않습니다.
 * 화면 시각(now)은 1초마다 바뀌므로 받은 직후에는 receivedAt보다 앞설 수 있어, 흐른 시간은 0 아래로 두지 않습니다.
 */
export const minutesLeft = (
  arrival: BusArrival,
  receivedAt: number,
  now: number,
) =>
  Math.max(
    0,
    arrival.predictTime - Math.floor(Math.max(0, now - receivedAt) / 60_000),
  );

/**
 * 이번 차를 얼마나 강조할지. 곧 도착이면 검정 칸으로 강조하고, 15분 이상 남았으면 흐리게 둡니다.
 */
export type ArrivalEmphasis = "imminent" | "normal" | "far";

export const arrivalEmphasis = (minutes: number): ArrivalEmphasis => {
  if (minutes <= IMMINENT_MINUTES) return "imminent";
  if (minutes >= FAR_MINUTES) return "far";
  return "normal";
};

/**
 * 남은 정류장 수 표시. 0이면 내 정류장에 들어오는 중이라 "진입 중"입니다.
 * 좁은 다음 차 칸은 "전"을 뺀 짧은 꼴(short)을 씁니다.
 */
export const stopsAwayLabel = (locationNo: number, form: "full" | "short") => {
  if (locationNo === 0) return "진입 중";
  return form === "full" ? `${locationNo}정거장 전` : `${locationNo}정거장`;
};

export const formatAgo = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return seconds < 60 ? `${seconds}초 전` : `${Math.floor(seconds / 60)}분 전`;
};
