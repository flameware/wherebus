import { MIN_SPIN_MS } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/cn";
import { useState } from "react";

/**
 * 화면 오른쪽 아래에 떠 있는 새로고침 버튼입니다.
 * 자동 갱신 때마다 돌면 눈에 거슬리므로, 누른 뒤에만 아이콘이 돕니다.
 */
export function RefreshFab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await Promise.all([
        onRefresh(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
      ]);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="새로고침"
      aria-disabled={spinning}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center bg-tt-ink text-white"
    >
      <svg
        aria-hidden
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        className={cn(spinning && "animate-spin motion-reduce:animate-none")}
      >
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 3v5h-5" />
      </svg>
    </button>
  );
}
