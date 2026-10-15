import { useEffect, useRef, useState } from "react";

// 이만큼(px) 당긴 뒤 놓으면 새로고침합니다.
export const PULL_THRESHOLD = 70;

// 새로고침하는 동안 화면을 이만큼(px) 내린 채로 두고 그 자리에 스피너를 보여줍니다.
export const REFRESH_HOLD = 56;

const MAX_PULL = 120;

// 응답이 너무 빨라도 스피너가 깜빡이고 사라지지 않도록 최소한 이만큼은 보여줍니다.
const MIN_SPIN_MS = 500;

/**
 * 페이지 맨 위에서 아래로 당겼다 놓으면 onRefresh를 호출합니다.
 * 현재 당긴 거리(px)와, 당겨서 시작한 새로고침이 진행 중인지를 반환합니다.
 */
export function usePullToRefresh(onRefresh: () => unknown) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      startY.current =
        !refreshingRef.current && window.scrollY <= 0
          ? e.touches[0].clientY
          : null;
    };
    const handleMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      // 손가락 이동의 절반만 따라오게 해서 당기는 느낌을 줍니다.
      pullRef.current = dy > 0 ? Math.min(MAX_PULL, dy * 0.5) : 0;
      setPull(pullRef.current);
    };
    const handleEnd = async () => {
      if (startY.current === null) return;
      const shouldRefresh = pullRef.current >= PULL_THRESHOLD;
      startY.current = null;
      pullRef.current = 0;
      if (!shouldRefresh) {
        setPull(0);
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      setPull(REFRESH_HOLD);
      try {
        await Promise.all([
          onRefresh(),
          new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
        ]);
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPull(0);
      }
    };

    // 시스템이 터치를 가로채면 새로고침하지 않고 되돌립니다.
    const handleCancel = () => {
      if (startY.current === null) return;
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleCancel);
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleCancel);
    };
  }, [onRefresh]);

  return { pull, refreshing };
}
