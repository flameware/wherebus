import { RouteRow } from "@/components/route-row";
import { isInPriorityHours } from "@/lib/stop-order";
import { ArrivalResult, FavoriteStop } from "@/lib/types";
import { cn } from "@flameware/ui";

const pad = (hour: number) => String(hour).padStart(2, "0");

interface StopSectionProps {
  stop: FavoriteStop;
  results: { [key: string]: ArrivalResult };
  now: number;
  // 하이드레이션 전에는 서버와 시각이 달라서 우선 시간대 반전을 그리지 않습니다.
  clockReady: boolean;
}

export const getFavoriteKey = (nodeId: string, routeId: string) =>
  `${nodeId}-${routeId}`;

/**
 * 정류장 하나의 시간표 섹션. 머리에 별칭, 정식 정류장명, 우선 시간대를 쓰고 노선 행을 잇습니다.
 */
export function StopSection({ stop, results, now, clockReady }: StopSectionProps) {
  const isPriorityNow = clockReady && isInPriorityHours(stop, new Date(now));

  return (
    <section className="bg-tt-panel">
      <header className="flex items-center gap-3 border-b border-tt-rule pt-3.5 pr-3 pb-2.5 pl-4">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h2 className="shrink-0 text-xl leading-tight font-extrabold">{stop.alias}</h2>
          {stop.stopName !== stop.alias && (
            <span className="truncate text-xs text-tt-sub">{stop.stopName}</span>
          )}
        </div>
        {stop.priorityHours && (
          <span
            className={cn(
              "shrink-0 px-1.5 py-0.5 font-tt-num text-[15px] font-semibold tabular-nums",
              isPriorityNow ? "bg-tt-ink text-white" : "text-tt-faint",
            )}
          >
            {pad(stop.priorityHours[0])}–{pad(stop.priorityHours[1])}시
          </span>
        )}
      </header>
      <div className="divide-y divide-tt-rule">
        {stop.routes.map((route) => {
          const key = getFavoriteKey(stop.nodeId, route.routeId);
          return <RouteRow key={key} route={route} result={results[key]} now={now} />;
        })}
      </div>
    </section>
  );
}
