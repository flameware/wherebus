"use client";

import { ArrivalTrack } from "@/components/arrival-track";
import { PULL_THRESHOLD, usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { STALE_SECONDS, formatAgo } from "@/lib/arrival-display";
import { ArrivalResult, FavoriteStop, RouteArrival } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

// 즐겨찾기 정류장 목록을 JSON 파일에서 가져옵니다.
import favoritesData from "@/lib/favorites.json";

const favoriteStops = favoritesData as FavoriteStop[];

// 자동 갱신 주기 (밀리초)
const REFRESH_INTERVAL_MS = 30_000;

const getFavoriteKey = (nodeId: string, routeId: string) =>
  `${nodeId}-${routeId}`;

// 남은 분과 "N초 전" 표시를 갱신하기 위해 1초마다 현재 시각을 바꿉니다.
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Home() {
  const [arrivalResults, setArrivalResults] = useState<{
    [key: string]: ArrivalResult;
  }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const now = useNow();

  const fetchAllBusData = useCallback(async () => {
    setIsRefreshing(true);
    const fetched: { [key: string]: RouteArrival | null } = {};

    await Promise.allSettled(
      favoriteStops.flatMap((stop) =>
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
      const next: { [key: string]: ArrivalResult } = {};
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
  }, []);

  useEffect(() => {
    // 화면이 보이는 동안만 주기적으로 갱신합니다. 탭이나 앱이 숨겨지면
    // 멈춰서 API 호출을 아끼고, 다시 보이면 바로 갱신한 뒤 재개합니다.
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const stopPolling = () => clearInterval(intervalId);
    const startPolling = () => {
      stopPolling();
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

  const pull = usePullToRefresh(fetchAllBusData);

  const results = Object.values(arrivalResults);
  const allFailed =
    results.length > 0 && results.every((r) => r.status === "error");
  const isStale =
    lastUpdated !== null && (now - lastUpdated) / 1000 > STALE_SECONDS;

  return (
    <main className="min-h-screen w-full bg-gray-100">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
        style={{
          transform: `translateY(${pull - 40}px)`,
          opacity: pull > 0 ? 1 : 0,
        }}
      >
        <div className="mt-2 rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow">
          {pull >= PULL_THRESHOLD ? "놓으면 새로고침" : "당겨서 새로고침"}
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-md px-4 pb-10 pt-4"
        style={{
          transform: `translateY(${pull}px)`,
          transition: pull ? "none" : "transform 200ms",
        }}
      >
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">버스어딨니</h1>
          {/* 터치가 없는 기기에서는 이 표시를 눌러 새로고침합니다. */}
          <button
            onClick={fetchAllBusData}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
              isStale ? "bg-amber-100 text-amber-800" : "bg-white text-gray-600",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isRefreshing
                  ? "animate-pulse bg-blue-500"
                  : isStale
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
            />
            {isRefreshing
              ? "갱신 중"
              : lastUpdated === null
                ? "불러오는 중"
                : `${formatAgo(now - lastUpdated)} 갱신`}
          </button>
        </header>

        {favoriteStops.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-3 text-sm text-gray-600">
            즐겨찾기 설정이 필요합니다. src/lib/favorites.json 파일을 확인하세요.
          </p>
        )}

        {allFailed && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>버스 정보를 불러오지 못했어요</span>
            <button
              onClick={fetchAllBusData}
              disabled={isRefreshing}
              className="font-semibold underline"
            >
              다시 시도
            </button>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {favoriteStops.map((stop) => (
            <section
              key={stop.nodeId}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <h2 className="mb-3 flex items-baseline gap-2">
                <span className="text-lg font-bold">{stop.alias}</span>
                {stop.stopName !== stop.alias && (
                  <span className="text-xs text-gray-500">{stop.stopName}</span>
                )}
              </h2>
              <div className="flex flex-col gap-5">
                {stop.routes.map((route) => {
                  const key = getFavoriteKey(stop.nodeId, route.routeId);
                  return (
                    <ArrivalTrack
                      key={key}
                      route={route}
                      result={arrivalResults[key]}
                      now={now}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
