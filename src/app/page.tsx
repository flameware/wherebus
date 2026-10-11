"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Timer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RouteArrival } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

// 즐겨찾기 목록을 JSON 파일에서 가져옵니다.
import favoritesData from "@/lib/favorites.json";

// 자동 갱신 주기 (밀리초)
const REFRESH_INTERVAL_MS = 30_000;

interface Favorite {
  name: string;
  cityCode: number | string;
  nodeId: string;
  routeId: string;
}

interface FavoriteGroups {
  [groupName: string]: Favorite[];
}

// 즐겨찾기별 조회 결과. "도착 예정 없음"(빈 arrivals)과 조회 실패(error)를 구분합니다.
type ArrivalResult =
  | { status: "ok"; data: RouteArrival }
  | { status: "error" };

const getFavoriteKey = (favorite: Favorite) =>
  `${favorite.nodeId}-${favorite.routeId}`;

const formatTime = (minutes: number) =>
  minutes <= 0 ? "곧 도착" : `${minutes}분 후`;

const formatClock = (date: Date) =>
  date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function Home() {
  const [arrivalResults, setArrivalResults] = useState<{
    [key: string]: ArrivalResult;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBusData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    const newArrivalResults: { [key: string]: ArrivalResult } = {};
    const favoriteList: Favorite[] = Object.values(
      favoritesData as FavoriteGroups,
    ).flat();

    if (favoriteList.length === 0) {
      setError(
        "즐겨찾기 설정이 필요합니다. src/lib/favorites.json 파일을 확인하세요.",
      );
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    await Promise.allSettled(
      favoriteList.map(async (favorite) => {
        const key = getFavoriteKey(favorite);
        try {
          const query = new URLSearchParams({
            nodeId: favorite.nodeId,
            routeId: favorite.routeId,
          });
          const res = await fetch(`/api/bus?${query.toString()}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP ${res.status}`);
          }

          const data: RouteArrival = await res.json();
          newArrivalResults[key] = { status: "ok", data };
        } catch (e) {
          console.error(`Failed to fetch data for ${favorite.name}:`, e);
          newArrivalResults[key] = { status: "error" };
        }
      }),
    );

    setArrivalResults(newArrivalResults);
    setLastUpdated(new Date());
    setIsLoading(false);
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

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-4 pb-20">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">버스어딨니</h1>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              {formatClock(lastUpdated)} 기준
            </span>
          )}
        </header>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading
          ? Array.from({ length: 2 }).map((_, groupIndex) => (
              <div key={groupIndex} className="mb-8">
                <h2 className="text-xl font-semibold mb-2" />
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">노선</TableHead>
                        <TableHead>정류장</TableHead>
                        <TableHead>도착예정</TableHead>
                        <TableHead className="text-right">
                          남은 정류장
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 2 }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          : Object.entries(favoritesData as FavoriteGroups).map(
              ([groupName, favorites]) => (
                <div key={groupName} className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">{groupName}</h2>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">노선</TableHead>
                          <TableHead>정류장</TableHead>
                          <TableHead>도착예정</TableHead>
                          <TableHead className="text-right">
                            남은 정류장
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {favorites.map((favorite) => {
                          const key = getFavoriteKey(favorite);
                          const result = arrivalResults[key];
                          const [stationName, routeLabel] =
                            favorite.name.split(" / ");
                          const [first, second] =
                            result?.status === "ok" ? result.data.arrivals : [];
                          return (
                            <TableRow key={key}>
                              <TableCell className="font-medium">
                                {result?.status === "ok"
                                  ? result.data.routeName
                                  : routeLabel || ""}
                              </TableCell>
                              <TableCell>{stationName || ""}</TableCell>
                              <TableCell>
                                {result?.status !== "ok" ? (
                                  <span className="text-red-600">
                                    조회 실패
                                  </span>
                                ) : first ? (
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1 text-blue-600">
                                      <Timer className="h-4 w-4" />
                                      {formatTime(first.predictTime)}
                                    </span>
                                    {second && (
                                      <span className="text-xs text-gray-500">
                                        다음 {formatTime(second.predictTime)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    도착 예정 없음
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {first ? (
                                  <div className="flex flex-col">
                                    <span>{first.locationNo}</span>
                                    {second && (
                                      <span className="text-xs text-gray-500">
                                        {second.locationNo}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ),
            )}
      </div>
      <div className="fixed bottom-0 w-full max-w-md p-4 bg-white dark:bg-gray-900 border-t">
        <Button
          onClick={fetchAllBusData}
          disabled={isRefreshing}
          className="w-full"
        >
          {isRefreshing ? "갱신 중..." : "새로고침"}
        </Button>
      </div>
    </main>
  );
}
