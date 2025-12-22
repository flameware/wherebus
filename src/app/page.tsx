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
import { BusArrivalInfo } from "@/lib/types";
import { useEffect, useState } from "react";

// 즐겨찾기 목록을 JSON 파일에서 가져옵니다.
import favoritesData from "@/lib/favorites.json";

interface Favorite {
  name: string;
  cityCode: number | string;
  nodeId: string;
  routeId: string;
}

interface FavoriteGroups {
  [groupName: string]: Favorite[];
}

export default function Home() {
  const [arrivalInfos, setArrivalInfos] = useState<{
    [key: string]: BusArrivalInfo | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBusData = async () => {
    setIsLoading(true);
    setError(null);
    const newArrivalInfos: { [key: string]: BusArrivalInfo | null } = {};
    const favoriteList: Favorite[] = Object.values(
      favoritesData as FavoriteGroups,
    ).flat();

    if (favoriteList.length === 0) {
      setError(
        "즐겨찾기 설정이 필요합니다. src/lib/favorites.json 파일을 확인하세요.",
      );
      setIsLoading(false);
      return;
    }

    await Promise.allSettled(
      favoriteList.map(async (favorite) => {
        const key = `${favorite.cityCode}-${favorite.nodeId}-${favorite.routeId}`;
        try {
          const query = new URLSearchParams({
            cityCode: String(favorite.cityCode),
            nodeId: favorite.nodeId,
            routeId: favorite.routeId,
          });
          const res = await fetch(`/api/bus?${query.toString()}`);

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP ${res.status}`);
          }

          const data: BusArrivalInfo = await res.json();
          newArrivalInfos[key] = data;
        } catch (e: any) {
          console.error(`Failed to fetch data for ${favorite.name}:`, e);
          newArrivalInfos[key] = null;
        }
      }),
    );

    setArrivalInfos(newArrivalInfos);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllBusData();
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds < 60) {
      return "곧 도착";
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    if (seconds === 0) {
      return `${minutes}분 후`;
    }
    return `${minutes}분 ${seconds}초 후`;
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-4 pb-20">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">버스어딨니</h1>
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
                          const key = `${favorite.cityCode}-${favorite.nodeId}-${favorite.routeId}`;
                          const arrivalInfo = arrivalInfos[key];
                          return (
                            <TableRow key={key}>
                              <TableCell className="font-medium">
                                {arrivalInfo
                                  ? arrivalInfo.routeno
                                  : favorite.name.split(" / ")[1] || ""}
                              </TableCell>
                              <TableCell>
                                {arrivalInfo
                                  ? arrivalInfo.nodenm
                                  : favorite.name.split(" / ")[0] || ""}
                              </TableCell>
                              <TableCell>
                                {arrivalInfo ? (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Timer className="h-4 w-4" />
                                    {formatTime(arrivalInfo.arrtime)}
                                  </span>
                                ) : (
                                  "정보 없음"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {arrivalInfo
                                  ? arrivalInfo.arrprevstationcnt
                                  : "-"}
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
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "갱신 중..." : "새로고침"}
        </Button>
      </div>
    </main>
  );
}
