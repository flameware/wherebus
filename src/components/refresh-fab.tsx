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
    // 판과 같은 폭의 틀에 넣어, 넓은 화면에서도 버튼이 판의 오른쪽 아래에 붙어 있게 합니다.
    // 틀은 터치를 통과시키고 버튼만 받습니다.
    // iOS 홈 화면 앱은 화면 맨 아래까지 그리는데 viewport-fit=cover가 아니라 safe-area-inset-bottom이 0입니다.
    // 각진 버튼은 꼭짓점이 화면의 둥근 모서리에 잘리므로, 이 버튼만 원형으로 둡니다.
    // 가장자리 간격 28px은 iOS 26 기본 앱(사진·Safari)의 아래쪽 둥근 버튼이 화면 가장자리에서 떨어진 거리에 맞춘 값입니다.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-full max-w-md justify-end px-7">
      <button
        type="button"
        onClick={handleClick}
        aria-label="새로고침"
        aria-busy={spinning}
        className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-tt-ink text-white active:bg-tt-sub"
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
    </div>
  );
}
