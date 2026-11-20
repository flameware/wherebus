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

// 노선 칸(76px)에 큰 글자로 들어가는 번호 길이. 이보다 길면("8800-1", "M4403") 한 단계 작게 씁니다.
const ROUTE_NUMBER_FIT = 4;

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
            <div className="h-11 w-24 bg-tt-rule/60" />
            <div className="h-2 bg-tt-rule/60" />
          </div>
          <div aria-hidden className="flex items-center justify-end border-l border-tt-rule px-3">
            <div className="h-6 w-10 bg-tt-rule/60" />
          </div>
        </>
      ) : !shown ? (
        <div className="col-span-2 flex items-center px-3 text-base font-bold text-tt-warn">
          조회 실패
        </div>
      ) : arrivals.length === 0 ? (
        <div className="col-span-2 flex flex-col justify-center gap-0.5 px-3">
          <span className="text-base font-bold text-tt-sub">운행 정보 없음</span>
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
      <span
        className={cn(
          "font-tt-num leading-none font-extrabold",
          number.length > ROUTE_NUMBER_FIT ? "text-base" : "text-xl",
        )}
      >
        {number}
      </span>
      {suffix && <span className="mt-1 text-xs leading-none font-bold">{suffix}</span>}
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

// 이번 차 칸이 11rem보다 좁으면(화면 폭 약 340px 아래) 글자를 줄여 한 줄에 맞춥니다.
// 칸 폭이 기준이라 @container 안에서 @max-[11rem]·@min-[11rem]으로 가릅니다.

function CurrentCell({ routeColor, first, next, minutes, stale, receivedAgo }: CurrentCellProps) {
  const emphasis = arrivalEmphasis(minutes);
  const imminent = emphasis === "imminent";
  return (
    <div className="@container flex min-w-0 flex-col justify-center gap-2 px-3 py-2.5">
      {/* 곧 도착 칸과 남은 분 숫자는 높이가 같아(44px) 상태가 바뀌어도 행이 움직이지 않습니다. */}
      <div className="relative flex flex-col gap-2">
        {imminent ? (
          // 지난 정보이면 검정 대신 흐린 칸으로 그려, 지금 나가라는 신호로 읽히지 않게 합니다.
          // 좁은 칸에서는 두 줄로 쌓습니다. 지난 정보일 때도 쌓아서 오른쪽에 표시 자리를 냅니다.
          <div
            className={cn(
              "flex h-11 flex-col justify-center gap-1 self-start px-2.5 whitespace-nowrap text-white",
              !stale &&
                "@min-[11rem]:flex-row @min-[11rem]:items-baseline @min-[11rem]:justify-start @min-[11rem]:gap-2 @min-[11rem]:py-2.5",
              stale ? "bg-tt-faint" : "bg-tt-ink",
            )}
          >
            <span className="text-2xl leading-none font-extrabold">곧 도착</span>
            <span className="text-xs leading-none">{stopsAwayLabel(first.locationNo, "full")}</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            {/* 15분 이상 남은 차는 색을 흐리는 대신 굵기를 낮춥니다. 흐린 색은 지난 정보에만 씁니다. */}
            <span
              className={cn(
                "flex shrink-0 items-baseline",
                stale
                  ? "font-bold text-tt-faint"
                  : emphasis === "far"
                    ? "font-medium text-tt-sub"
                    : "font-bold",
              )}
            >
              {/* 두 자리 폭에 오른쪽으로 붙여, "분"과 남은 정류장이 모든 행에서 같은 자리에 옵니다.
                  굵기마다 숫자 폭이 달라서 ch 대신 굵은 두 자리에 맞춘 em으로 잡습니다. */}
              <span className="min-w-[1.25em] text-right font-tt-num text-[44px] leading-none tabular-nums">
                {minutes}
              </span>
              <span className="text-base">분</span>
            </span>
            <span className="truncate text-sm text-tt-sub">
              <span className="@max-[11rem]:hidden">{stopsAwayLabel(first.locationNo, "full")}</span>
              <span className="@min-[11rem]:hidden">{stopsAwayLabel(first.locationNo, "short")}</span>
            </span>
          </div>
        )}
        {stale && (
          // 숫자 위 오른쪽 빈 자리에 띄워 행 높이를 늘리지 않습니다.
          // 좁은 칸의 곧 도착은 그 자리가 없어 아래로 흘려보냅니다.
          <span
            className={cn(
              "absolute top-0 right-0 border border-tt-warn bg-tt-panel px-1.5 py-0.5 text-xs leading-none font-bold whitespace-nowrap text-tt-warn",
              imminent && "@max-[11rem]:static @max-[11rem]:self-start",
            )}
          >
            {receivedAgo} 정보
          </span>
        )}
      </div>
      <StopCells color={routeColor} first={first} next={next} dimmed={stale} />
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
            <span className="text-xs leading-none">분</span>
          </span>
          <span className="mt-1.5 text-xs leading-none whitespace-nowrap text-tt-sub">
            {stopsAwayLabel(next.locationNo, "short")}
          </span>
        </>
      ) : (
        <span className="font-tt-num text-2xl leading-none font-bold text-tt-faint">
          <span aria-hidden>—</span>
          <span className="sr-only">없음</span>
        </span>
      )}
    </div>
  );
}
