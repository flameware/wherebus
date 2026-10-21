import {
  TRACK_STOPS,
  LABEL_GAP_STOPS,
  ArrivalEmphasis,
  arrivalEmphasis,
  formatAgo,
  formatMinutes,
  minutesLeft,
  routeBadgeColors,
} from "@/lib/arrival-display";
import { ArrivalResult, FavoriteRoute } from "@/lib/types";
import { cn } from "@flameware/ui";
import { Badge } from "@flameware/ui/badge";
import { Skeleton } from "@flameware/ui/skeleton";
import { Text } from "@flameware/ui/text";

interface ArrivalTrackProps {
  route: FavoriteRoute;
  result: ArrivalResult | undefined; // undefined: 아직 한 번도 조회하지 않음
  now: number;
}

// 트랙의 왼쪽 끝은 TRACK_STOPS 정거장 전, 오른쪽 끝은 내 정류장입니다.
const trackStops = (locationNo: number) => Math.min(locationNo, TRACK_STOPS);
const trackPosition = (locationNo: number) =>
  `${(1 - trackStops(locationNo) / TRACK_STOPS) * 100}%`;

// 회색 위계는 text-muted 하나로 두고, 위계는 opacity와 굵기로 나눕니다.
// 두 번째 차는 라벨과 함께 점도 흐리게 둡니다.
const EMPHASIS_CLASSES: Record<ArrivalEmphasis, { label: string; dot: string }> = {
  imminent: { label: "text-danger", dot: "" },
  normal: { label: "", dot: "" },
  far: { label: "text-muted opacity-70", dot: "" },
  secondary: { label: "font-medium text-muted opacity-70", dot: "opacity-40" },
};

/**
 * 노선 하나의 도착 예정 차량들이 내 정류장으로 다가오는 모습을 가로 트랙으로 보여줍니다.
 */
export function ArrivalTrack({ route, result, now }: ArrivalTrackProps) {
  const badge = routeBadgeColors(route.routeType);
  const routeColor = badge.background;
  const shown =
    result?.status === "ok" ? result : result?.status === "error" ? result.last : undefined;
  const isStale = result?.status === "error" && shown !== undefined;
  const arrivals = shown?.data.arrivals ?? [];
  const [first, next] = arrivals;
  // 두 대 모두 트랙 밖이면 같은 자리에 겹치므로 다음 차는 트랙에 그리지 않습니다.
  const isNextOffTrack =
    next !== undefined && first.locationNo > TRACK_STOPS && next.locationNo > TRACK_STOPS;
  const isNextLabelHidden =
    next !== undefined &&
    (isNextOffTrack ||
      Math.abs(trackStops(next.locationNo) - trackStops(first.locationNo)) <= LABEL_GAP_STOPS);
  const drawn = isNextOffTrack ? [first] : arrivals;

  return (
    <div className={cn("flex min-h-12 items-center gap-3", isStale && "opacity-50")}>
      <span
        className="inline-flex h-8 min-w-12 shrink-0 items-center justify-center rounded-md px-2 text-base font-bold tabular-nums"
        style={{ backgroundColor: badge.background, color: badge.foreground }}
      >
        {route.routeName}
      </span>

      {!result ? (
        <Skeleton announce={false} className="h-5 flex-1" />
      ) : !shown ? (
        <Text as="span" tone="danger" className="font-medium">
          조회 실패
        </Text>
      ) : arrivals.length === 0 ? (
        <div className="flex flex-col">
          <Text as="span" tone="muted" className="font-medium">
            운행 정보 없음
          </Text>
          <Text as="span" size="xs" tone="muted" className="opacity-70">
            첫차/막차 시간 외일 수 있어요
          </Text>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <div
            className="relative mx-2 mt-6 h-1 rounded-full"
            style={{ backgroundColor: `${routeColor}33` }}
          >
            <div
              className="absolute -right-2 -top-1.5 h-4 w-4 rounded-full border-[3px] bg-surface"
              style={{ borderColor: routeColor }}
            />
            {drawn.map((arrival, i) => {
              const minutes = minutesLeft(arrival, shown.receivedAt, now);
              const emphasis = arrivalEmphasis(minutes, i === 0 ? "first" : "second");
              return (
                <div
                  key={i}
                  className="absolute -top-1.5 -translate-x-1/2"
                  style={{ left: trackPosition(arrival.locationNo) }}
                >
                  {!(i > 0 && isNextLabelHidden) && (
                    <span
                      className={cn(
                        "absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums",
                        EMPHASIS_CLASSES[emphasis].label,
                      )}
                    >
                      {arrival.locationNo > TRACK_STOPS && "◀ "}
                      {formatMinutes(minutes)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full ring-2 ring-(--ds-bg-surface)",
                      EMPHASIS_CLASSES[emphasis].dot,
                    )}
                    style={{ backgroundColor: routeColor }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between gap-2 text-xs text-muted">
            <span className="truncate">
              {arrivals[0].locationNo === 0
                ? "정류장 진입 중"
                : `${arrivals[0].locationNo}정거장 전 · ${arrivals[0].stationNm}`}
            </span>
            {isNextLabelHidden && (
              <span className="shrink-0">
                다음 차 {formatMinutes(minutesLeft(next, shown.receivedAt, now))}
              </span>
            )}
            {isStale && (
              <Badge tone="warning" className="shrink-0">
                {formatAgo(now - shown.receivedAt)} 정보
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
