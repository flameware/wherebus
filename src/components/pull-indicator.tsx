import { PULL_THRESHOLD } from "@/hooks/use-pull-to-refresh";

const SPOKES = 8;

interface PullIndicatorProps {
  pull: number; // 당긴 거리(px)
  refreshing: boolean;
}

/**
 * iOS Safari처럼 당긴 만큼 스포크가 하나씩 채워지고,
 * 다 채워지면(놓으면 새로고침) 살짝 커지며, 새로고침 중에는 돕니다.
 */
export function PullIndicator({ pull, refreshing }: PullIndicatorProps) {
  const progress = Math.min(1, pull / PULL_THRESHOLD);
  const visibleSpokes = refreshing ? SPOKES : Math.floor(progress * SPOKES);
  const armed = refreshing || progress >= 1;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
      style={{
        // 내려온 화면 위 빈 공간의 가운데에 둡니다.
        transform: `translateY(${pull / 2 - 14}px)`,
        opacity: pull > 0 ? 1 : 0,
        transition: pull && !refreshing ? "none" : "transform 200ms, opacity 200ms",
      }}
      aria-hidden
    >
      <svg
        width="28"
        height="28"
        viewBox="-14 -14 28 28"
        className="text-gray-500"
        style={{
          transform: `scale(${armed ? 1 : 0.85})`,
          transition: "transform 150ms",
        }}
      >
        <g
          style={
            refreshing
              ? {
                  animation: `pull-spinner-rotate 0.8s steps(${SPOKES}) infinite`,
                }
              : undefined
          }
        >
          {Array.from({ length: SPOKES }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1="-6"
              x2="0"
              y2="-11"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${(360 / SPOKES) * i})`}
              // 당기는 중에는 12시 방향부터 시계 방향으로 하나씩 나타나고,
              // 돌 때는 꼬리처럼 점점 흐려집니다.
              opacity={
                i >= visibleSpokes
                  ? 0
                  : refreshing
                    ? 1 - (((SPOKES - i) % SPOKES) / SPOKES) * 0.75
                    : 1
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
