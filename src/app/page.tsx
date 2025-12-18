"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { BusCard } from "@/components/bus-card";
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

export default function Home() {
  const [arrivalInfos, setArrivalInfos] = useState<{ [key: string]: BusArrivalInfo | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBusData = async () => {
    setIsLoading(true);
    setError(null);
    const newArrivalInfos: { [key: string]: BusArrivalInfo | null } = {};
    const favoriteList: Favorite[] = favoritesData;

    if (favoriteList.length === 0) {
      setError("즐겨찾기 설정이 필요합니다. src/lib/favorites.json 파일을 확인하세요.");
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
      })
    );
    
    setArrivalInfos(newArrivalInfos);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllBusData();
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-4 pb-20"> {/* 하단 버튼 공간 확보를 위해 padding-bottom 추가 */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">BusOnTime</h1>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {(favoritesData as Favorite[]).map((favorite) => {
            const key = `${favorite.cityCode}-${favorite.nodeId}-${favorite.routeId}`;
            return (
              <BusCard 
                key={key}
                favoriteName={favorite.name}
                arrivalInfo={arrivalInfos[key]} 
                isLoading={isLoading} 
              />
            );
          })}
          {favoritesData.length === 0 && !isLoading && !error && (
            <p className="text-center text-gray-500">
              `src/lib/favorites.json` 파일에 즐겨찾기를 추가해주세요.
            </p>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 w-full max-w-md p-4 bg-white dark:bg-gray-900 border-t">
        <Button onClick={fetchAllBusData} disabled={isLoading} className="w-full">
          {isLoading ? "갱신 중..." : "새로고침"}
        </Button>
      </div>
    </main>
  );
}
