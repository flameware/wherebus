import { Skeleton } from "@/components/ui/skeleton";
import {
  ROUTE_COLORS,
  TRACK_STOPS,
  IMMINENT_MINUTES,
  FAR_MINUTES,
  formatAgo,
  formatMinutes,
  minutesLeft,
} from "@/lib/arrival-display";
import { ArrivalResult, FavoriteRoute } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ArrivalTrackProps {
  route: FavoriteRoute;
  result: ArrivalResult | undefined; // undefined: 아직 한 번도 조회하지 않음
  now: number;
}

// 트랙의 왼쪽 끝은 TRACK_STOPS 정거장 전, 오른쪽 끝은 내 정류장입니다.
const trackPosition = (locationNo: number) =>
  `${(1 - Math.min(locationNo, TRACK_STOPS) / TRACK_STOPS) * 100}%`;

/**
 * 노선 하나의 도착 예정 차량들이 내 정류장으로 다가오는 모습을 가로 트랙으로 보여줍니다.
 */
export function ArrivalTrack({ route, result, now }: ArrivalTrackProps) {
  const color = ROUTE_COLORS[route.routeType];
  const shown =
    result?.status === "ok" ? result : result?.status === "error" ? result.last : undefined;
  const isStale = result?.status === "error" && shown !== undefined;
  const arrivals = shown?.data.arrivals ?? [];

  return (
    <div className={cn("flex min-h-12 items-center gap-3", isStale && "opacity-50")}>
      <span
        className="inline-flex h-8 min-w-12 shrink-0 items-center justify-center rounded-md px-2 text-base font-bold text-white tabular-nums"
        style={{ backgroundColor: color }}
      >
        {route.routeName}
      </span>

      {!result ? (
        <Skeleton className="h-5 flex-1" />
      ) : !shown ? (
        <span className="text-sm font-medium text-rose-600">조회 실패</span>
      ) : arrivals.length === 0 ? (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">운행 정보 없음</span>
          <span className="text-xs text-gray-400">첫차/막차 시간 외일 수 있어요</span>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <div
            className="relative mx-2 mt-6 h-1 rounded-full"
            style={{ backgroundColor: `${color}33` }}
          >
            <div
              className="absolute -right-2 -top-1.5 h-4 w-4 rounded-full border-[3px] bg-white"
              style={{ borderColor: color }}
            />
            {arrivals.map((arrival, i) => {
              const minutes = minutesLeft(arrival, shown.receivedAt, now);
              return (
                <div
                  key={i}
                  className="absolute -top-1.5 -translate-x-1/2"
                  style={{ left: trackPosition(arrival.locationNo) }}
                >
                  <span
                    className={cn(
                      "absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums",
                      i > 0 && "font-medium text-gray-400",
                      i === 0 && minutes >= FAR_MINUTES && "text-gray-400",
                      i === 0 && minutes <= IMMINENT_MINUTES && "text-rose-600",
                    )}
                  >
                    {arrival.locationNo > TRACK_STOPS && "◀ "}
                    {formatMinutes(minutes)}
                  </span>
                  <div
                    className={cn("h-4 w-4 rounded-full ring-2 ring-white", i > 0 && "opacity-40")}
                    style={{ backgroundColor: color }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between gap-2 text-[11px] text-gray-500">
            <span className="truncate">
              {arrivals[0].locationNo === 0
                ? "정류장 진입 중"
                : `${arrivals[0].locationNo}정거장 전 · ${arrivals[0].stationNm}`}
            </span>
            {isStale && (
              <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                {formatAgo(now - shown.receivedAt)} 정보
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
