import { useEffect, useRef, useState } from "react";

// 이만큼(px) 당긴 뒤 놓으면 새로고침합니다.
export const PULL_THRESHOLD = 70;

const MAX_PULL = 120;

/**
 * 페이지 맨 위에서 아래로 당겼다 놓으면 onRefresh를 호출합니다. 현재 당긴 거리(px)를 반환합니다.
 */
export function usePullToRefresh(onRefresh: () => void) {
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const handleMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      // 손가락 이동의 절반만 따라오게 해서 당기는 느낌을 줍니다.
      pullRef.current = dy > 0 ? Math.min(MAX_PULL, dy * 0.5) : 0;
      setPull(pullRef.current);
    };
    const handleEnd = () => {
      if (pullRef.current >= PULL_THRESHOLD) onRefresh();
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [onRefresh]);

  return pull;
}
