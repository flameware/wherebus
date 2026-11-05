import {
  TRACK_STOPS,
  arrivalEmphasis,
  formatAgo,
  minutesLeft,
  routeCellColors,
  splitRouteName,
  stopsAwayLabel,
  trackCellIndex,
} from "@/lib/arrival-display";
import { ArrivalResult, BusArrival, FavoriteRoute } from "@/lib/types";
import { cn } from "@/lib/cn";

interface RouteRowProps {
  route: FavoriteRoute;
  result: ArrivalResult | undefined; // undefined: 아직 한 번도 조회하지 않음
  now: number;
}

// 노선 | 이번 차 | 다음 차. 칼럼 머리(arrival-board)와 같은 값을 씁니다.
export const ROUTE_GRID = "grid grid-cols-[76px_1fr_84px]";

// 노선 색에 붙이는 알파(16진수). 두 번째 차 칸은 45%, 첫 차와 내 정류장 사이는 22%입니다.
const SECOND_ALPHA = "73";
const BETWEEN_ALPHA = "38";

/**
 * 시간표 한 행: 노선 칸, 이번 차(남은 분과 정거장 칸), 다음 차.
 * 스크린 리더는 노선 번호, 남은 분, 남은 정류장, 다음 차 순으로 읽습니다.
 */
export function RouteRow({ route, result, now }: RouteRowProps) {
  const shown =
    result?.status === "ok" ? result : result?.status === "error" ? result.last : undefined;
  const isStale = result?.status === "error" && shown !== undefined;
  const arrivals = shown?.data.arrivals ?? [];
  const [first, next] = arrivals;
  const colors = routeCellColors(route.routeType);

  return (
    <div className={cn(ROUTE_GRID, "min-h-21")}>
      <RouteCell routeName={route.routeName} colors={colors} />

      {!result ? (
        <>
          {/* 판 바탕보다 조금 진한 빈 블록입니다. 로딩 중이라는 사실은 제목 띠의 신선도 표시가 한 번만 알립니다. */}
          <div aria-hidden className="flex flex-col justify-center gap-2 px-3 py-2.5">
            <div className="h-9 w-24 bg-tt-rule/60" />
            <div className="h-2 bg-tt-rule/60" />
          </div>
          <div aria-hidden className="flex items-center justify-end border-l border-tt-rule px-3">
            <div className="h-6 w-10 bg-tt-rule/60" />
          </div>
        </>
      ) : !shown ? (
        <div className="col-span-2 flex items-center px-3 text-[15px] font-bold text-tt-warn">
          조회 실패
        </div>
      ) : arrivals.length === 0 ? (
        <div className="col-span-2 flex flex-col justify-center gap-0.5 px-3">
          <span className="text-[15px] font-bold text-tt-sub">운행 정보 없음</span>
          <span className="text-xs text-tt-faint">첫차/막차 시간 외일 수 있어요</span>
        </div>
      ) : (
        <>
          <CurrentCell
            routeColor={colors.background}
            first={first}
            next={next}
            minutes={minutesLeft(first, shown.receivedAt, now)}
            stale={isStale}
            receivedAgo={formatAgo(now - shown.receivedAt)}
          />
          <NextCell
            next={
              next && {
                minutes: minutesLeft(next, shown.receivedAt, now),
                locationNo: next.locationNo,
              }
            }
            stale={isStale}
          />
        </>
      )}
    </div>
  );
}

function RouteCell({
  routeName,
  colors,
}: {
  routeName: string;
  colors: ReturnType<typeof routeCellColors>;
}) {
  const { number, suffix } = splitRouteName(routeName);
  return (
    <div
      className="flex flex-col items-center justify-center px-1 text-center"
      style={{ backgroundColor: colors.background, color: colors.foreground }}
    >
      <span className="font-tt-num text-[21px] leading-none font-extrabold tabular-nums">
        {number}
      </span>
      {suffix && <span className="mt-1 text-[11px] leading-none font-bold">{suffix}</span>}
    </div>
  );
}

interface CurrentCellProps {
  routeColor: string;
  first: BusArrival;
  next: BusArrival | undefined;
  minutes: number;
  stale: boolean; // 지난 정보인지
  receivedAgo: string; // 값을 받은 시각("N분 전"). 지난 정보일 때만 보여줍니다.
}

function CurrentCell({ routeColor, first, next, minutes, stale, receivedAgo }: CurrentCellProps) {
  const emphasis = arrivalEmphasis(minutes);
  return (
    <div className="flex min-w-0 flex-col justify-center gap-2 px-3 py-2.5">
      {emphasis === "imminent" ? (
        // 지난 정보이면 검정 대신 흐린 칸으로 그려, 지금 나가라는 신호로 읽히지 않게 합니다.
        <div
          className={cn(
            "flex items-baseline gap-2 self-start px-2.5 py-1 text-white",
            stale ? "bg-tt-faint" : "bg-tt-ink",
          )}
        >
          <span className="text-2xl leading-tight font-extrabold">곧 도착</span>
          <span className="text-xs">{stopsAwayLabel(first.locationNo, "full")}</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "flex items-baseline font-bold",
              (emphasis === "far" || stale) && "text-tt-faint",
            )}
          >
            <span className="font-tt-num text-[44px] leading-none tabular-nums">{minutes}</span>
            <span className="text-[15px]">분</span>
          </span>
          <span className="truncate text-[13px] text-tt-sub">
            {stopsAwayLabel(first.locationNo, "full")}
          </span>
        </div>
      )}
      <StopCells color={routeColor} first={first} next={next} dimmed={stale} />
      {stale && (
        <span className="self-start border border-tt-warn px-1.5 py-px text-[11px] font-bold text-tt-warn">
          {receivedAgo} 정보
        </span>
      )}
    </div>
  );
}

/**
 * 정거장 칸: 왼쪽 끝이 10정거장 전, 오른쪽 끝(검정)이 내 정류장입니다.
 * 두 차가 같은 칸이면 첫 차 표시가 이깁니다.
 */
function StopCells({
  color,
  first,
  next,
  dimmed,
}: {
  color: string; // 노선 색
  first: BusArrival;
  next: BusArrival | undefined;
  dimmed: boolean;
}) {
  const firstCell = trackCellIndex(first.locationNo);
  const nextCell = next && trackCellIndex(next.locationNo);
  const cellColor = (i: number) => {
    if (i === firstCell) return color;
    if (i === nextCell) return `${color}${SECOND_ALPHA}`;
    if (i > firstCell) return `${color}${BETWEEN_ALPHA}`;
    return undefined;
  };

  return (
    <div aria-hidden className={cn("flex h-2 gap-0.5", dimmed && "opacity-45")}>
      {Array.from({ length: TRACK_STOPS }, (_, i) => (
        <span
          key={i}
          className="flex-1 bg-tt-rule"
          style={{ backgroundColor: cellColor(i) }}
        />
      ))}
      <span className="w-3.5 bg-tt-ink" />
    </div>
  );
}

function NextCell({
  next,
  stale,
}: {
  next: { minutes: number; locationNo: number } | undefined;
  stale: boolean;
}) {
  return (
    <div className="flex flex-col items-end justify-center border-l border-tt-rule px-3 text-right">
      <span className="sr-only">다음 차</span>
      {next ? (
        <>
          <span
            className={cn("flex items-baseline font-bold", stale ? "text-tt-faint" : "text-tt-sub")}
          >
            <span className="font-tt-num text-2xl leading-none tabular-nums">{next.minutes}</span>
            <span className="text-xs">분</span>
          </span>
          <span className="mt-1 text-[11px] text-tt-sub">
            {stopsAwayLabel(next.locationNo, "short")}
          </span>
        </>
      ) : (
        <span className="font-tt-num text-2xl font-bold text-tt-rule">
          <span aria-hidden>—</span>
          <span className="sr-only">없음</span>
        </span>
      )}
    </div>
  );
}
