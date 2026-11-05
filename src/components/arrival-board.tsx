"use client";

import { PullIndicator } from "@/components/pull-indicator";
import { ROUTE_GRID } from "@/components/route-row";
import { StopSection } from "@/components/stop-section";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { STALE_SECONDS, formatAgo } from "@/lib/arrival-display";
import { getFavoriteKey } from "@/lib/favorite-key";
import { padTwo } from "@/lib/pad";
import { ArrivalResults, FavoriteStop, RouteArrival } from "@/lib/types";
import { singleFlight } from "@/lib/single-flight";
import { orderStops } from "@/lib/stop-order";
import { cn } from "@/lib/cn";
import { useCallback, useEffect, useMemo, useState } from "react";

// 자동 갱신 주기 (밀리초)
const REFRESH_INTERVAL_MS = 30_000;

const formatClock = (ms: number) => {
  const date = new Date(ms);
  return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
};

// 남은 분과 "N초 전" 표시를 갱신하기 위해 1초마다 현재 시각을 바꿉니다.
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * 한 프로필의 정류장들을 받아 도착 정보를 주기적으로 불러와 보여줍니다.
 * 다른 프로필의 정류장이 브라우저로 내려가지 않도록, 정류장은 서버 쪽 페이지가 골라서 넘겨줍니다.
 */
export function ArrivalBoard({ stops }: { stops: FavoriteStop[] }) {
  const [arrivalResults, setArrivalResults] = useState<ArrivalResults>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  // 정류장 순서를 정한 시각. 보는 도중에 정류장 섹션이 움직이지 않도록 화면이 보이기 시작할 때만 바꿉니다.
  const [orderedAt, setOrderedAt] = useState<number | null>(null);
  const now = useNow();

  const orderedStops = useMemo(
    () =>
      orderedAt === null
        ? stops
        : orderStops(stops, new Date(orderedAt)),
    [stops, orderedAt],
  );

  const fetchOnce = useCallback(async () => {
    setIsRefreshing(true);
    const fetched: { [key: string]: RouteArrival | null } = {};

    await Promise.allSettled(
      stops.flatMap((stop) =>
        stop.routes.map(async (route) => {
          const key = getFavoriteKey(stop.nodeId, route.routeId);
          try {
            const query = new URLSearchParams({
              nodeId: stop.nodeId,
              routeId: route.routeId,
            });
            const res = await fetch(`/api/bus?${query.toString()}`, {
              cache: "no-store",
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            fetched[key] = await res.json();
          } catch (e) {
            console.error(
              `Failed to fetch data for ${stop.alias} / ${route.routeName}:`,
              e,
            );
            fetched[key] = null;
          }
        }),
      ),
    );

    // 조회에 실패한 노선은 마지막으로 받은 값을 함께 들고 있습니다.
    const receivedAt = Date.now();
    setArrivalResults((prev) => {
      const next: ArrivalResults = {};
      for (const [key, data] of Object.entries(fetched)) {
        const before = prev[key];
        next[key] = data
          ? { status: "ok", data, receivedAt }
          : {
              status: "error",
              last:
                before?.status === "ok"
                  ? { data: before.data, receivedAt: before.receivedAt }
                  : before?.last,
            };
      }
      return next;
    });
    setLastUpdated(receivedAt);
    setIsRefreshing(false);
  }, [stops]);

  // 자동 갱신, 당겨서 새로고침, 버튼이 겹쳐도 조회는 한 번만 돌게 합니다.
  const fetchAllBusData = useMemo(() => singleFlight(fetchOnce), [fetchOnce]);

  useEffect(() => {
    // 화면이 보이는 동안만 주기적으로 갱신합니다. 탭이나 앱이 숨겨지면
    // 멈춰서 API 호출을 아끼고, 다시 보이면 바로 갱신한 뒤 재개합니다.
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const stopPolling = () => clearInterval(intervalId);
    const startPolling = () => {
      stopPolling();
      setOrderedAt(Date.now());
      fetchAllBusData();
      intervalId = setInterval(fetchAllBusData, REFRESH_INTERVAL_MS);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAllBusData]);

  const { pull, refreshing } = usePullToRefresh(fetchAllBusData);

  const results = Object.values(arrivalResults);
  const allFailed =
    results.length > 0 && results.every((r) => r.status === "error");
  const isRefreshDelayed =
    lastUpdated !== null && (now - lastUpdated) / 1000 > STALE_SECONDS;

  // 서버가 미리 그린 화면과 시각이 달라 하이드레이션이 어긋나지 않도록, 시계와 우선 시간대 반전은
  // 화면이 보이기 시작한 뒤(정렬 시각이 정해진 뒤)부터 그립니다.
  const clockReady = orderedAt !== null;

  return (
    <>
      {/* iOS 26부터 홈 화면 웹앱은 화면 위쪽에 블러를 깔아 헤더가 흐려집니다. 배경색이 있는 sticky 띠가
          위쪽 가장자리를 덮고 있으면 WebKit이 블러 대신 그 색을 씁니다.
          브라우저에서는 화면 배경과 같은 색이라 보이지 않습니다. 홈 화면 웹앱에서는 투명한 상태 표시줄
          (layout.tsx의 black-translucent) 자리를 헤더와 같은 검은색으로 채워, 헤더가 화면 맨 위까지 이어집니다. */}
      <div
        aria-hidden
        className="sticky top-0 z-30 h-4 bg-tt-ground [@media(display-mode:standalone)]:h-[env(safe-area-inset-top)] [@media(display-mode:standalone)]:bg-tt-ink"
      />
      <PullIndicator pull={pull} refreshing={refreshing} />

      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pull && !refreshing ? "none" : "transform 200ms",
        }}
      >
        {/* 배경은 body가 바탕 토큰으로 칠합니다. */}
        <main className="mx-auto w-full max-w-md">
          <header className="flex items-center justify-between gap-3 bg-tt-ink px-4 pt-3.5 pb-3 text-white">
            <h1 className="text-[19px] leading-tight font-extrabold">버스어딨니</h1>
            <div className="flex items-center gap-3">
              {/* 터치가 없는 기기에서는 이 표시를 눌러 새로고침합니다.
                  갱신 중에도 점이 보이도록 disabled 대신 aria-disabled만 겁니다.
                  겹친 클릭은 fetchAllBusData(singleFlight)가 막습니다. */}
              <button
                type="button"
                onClick={fetchAllBusData}
                aria-disabled={isRefreshing}
                className={cn(
                  "flex min-h-6 items-center gap-1.5 px-2 py-1 text-xs",
                  isRefreshDelayed ? "bg-tt-warn font-bold text-white" : "text-tt-rule",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isRefreshing
                      ? "animate-pulse bg-white"
                      : isRefreshDelayed
                        ? "bg-white"
                        : "bg-tt-fresh",
                  )}
                />
                {isRefreshing
                  ? "갱신 중"
                  : lastUpdated === null
                    ? "불러오는 중"
                    : `${formatAgo(now - lastUpdated)} 갱신`}
              </button>
              <time
                className="min-w-[3.25rem] text-right font-tt-num text-xl leading-none font-bold tabular-nums"
                dateTime={clockReady ? new Date(now).toISOString() : undefined}
              >
                {clockReady ? formatClock(now) : null}
              </time>
            </div>
          </header>

          {stops.length === 0 ? (
            <div className="bg-tt-panel px-4 py-10 text-center">
              <p className="text-[15px] font-bold">즐겨찾기 설정이 필요합니다</p>
              <p className="mt-1 text-xs text-tt-sub">
                src/lib/favorites.json 파일을 확인하세요
              </p>
            </div>
          ) : (
            <>
              {/* 스크롤해도 iOS sticky 띠 바로 아래에 붙어 있습니다. 칼럼 이름은 보는 사람용이라 읽지 않습니다. */}
              <div
                aria-hidden
                className={cn(
                  ROUTE_GRID,
                  "sticky top-4 z-20 border-b border-tt-rule bg-tt-panel text-[11px] font-bold text-tt-sub",
                )}
              >
                <span className="px-3 py-1.5">노선</span>
                <span className="border-l border-tt-rule px-3 py-1.5">이번 차</span>
                <span className="border-l border-tt-rule px-3 py-1.5 text-right">다음 차</span>
              </div>

              {allFailed && (
                <div className="flex items-center justify-between gap-3 border-b border-tt-rule bg-tt-panel px-4 py-2.5 text-[13px] font-bold text-tt-warn">
                  <span>버스 정보를 불러오지 못했어요</span>
                  <button
                    type="button"
                    onClick={fetchAllBusData}
                    aria-disabled={isRefreshing}
                    className="min-h-6 shrink-0 px-1 underline underline-offset-2"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {orderedStops.map((stop) => (
                  <StopSection
                    key={stop.nodeId}
                    stop={stop}
                    results={arrivalResults}
                    now={now}
                    clockReady={clockReady}
                  />
                ))}
              </div>
            </>
          )}

          <p className="py-4 text-center text-[11px] text-tt-faint">
            30초마다 새로 받아요 · 당겨서 새로고침
          </p>
        </main>
      </div>
    </>
  );
}
