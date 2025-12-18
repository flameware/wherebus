import { BusArrivalInfo } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Timer } from "lucide-react";

interface BusCardProps {
  arrivalInfo: BusArrivalInfo | null;
  isLoading: boolean;
  favoriteName: string; // 즐겨찾기 이름 표시용
}

/**
 * A component to display real-time arrival information for a specific bus route.
 * Optimized with shadcn/ui best practices.
 */
export function BusCard({ arrivalInfo, isLoading, favoriteName }: BusCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48 mt-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!arrivalInfo) {
    return (
      <Card className="w-full max-w-sm border-dashed">
        <CardHeader>
          <CardTitle>{favoriteName}</CardTitle>
          <CardDescription>도착 정보를 조회할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>정보 없음</AlertTitle>
            <AlertDescription>
              운행이 종료되었거나, 해당 정류소에 도착하는 버스가 없습니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { routeno, nodenm, arrtime, arrprevstationcnt } = arrivalInfo;
  
  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds < 60) {
      return '곧 도착';
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    if (seconds === 0) {
      return `${minutes}분 후`;
    }
    return `${minutes}분 ${seconds}초 후`;
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {routeno}번
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              ({arrivalInfo.routetp})
            </span>
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {nodenm}
          </span>
        </CardTitle>
        <CardDescription>{favoriteName}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between text-lg font-bold text-blue-600">
          <span className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {formatTime(arrtime)}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {arrprevstationcnt} 정거장 전
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
