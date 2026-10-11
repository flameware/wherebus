import type { FavoriteStop } from "@/lib/types";

/**
 * 시각이 정류장의 우선 시간대 [시작 시, 끝 시) 안에 있는지 확인합니다.
 * 시작이 끝보다 크면 자정을 넘는 시간대로 봅니다 (예: [22, 2]).
 */
export const isInPriorityHours = (stop: FavoriteStop, date: Date) => {
  if (!stop.priorityHours) return false;
  const [start, end] = stop.priorityHours;
  const hour = date.getHours();
  return start <= end
    ? start <= hour && hour < end
    : hour >= start || hour < end;
};

/**
 * 우선 시간대에 해당하는 정류장을 맨 위로 올립니다. 나머지는 즐겨찾기 파일 순서를 유지합니다.
 */
export const orderStops = (stops: FavoriteStop[], date: Date) => [
  ...stops.filter((stop) => isInPriorityHours(stop, date)),
  ...stops.filter((stop) => !isInPriorityHours(stop, date)),
];
