import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { APP_THEME_COLOR } from "@/lib/app-icon";

// 숫자·영문 글꼴. globals.css의 --font-tt-num 스택이 이 변수를 씁니다.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-num",
});

export const metadata: Metadata = {
  title: "버스어딨니",
  description: "실시간 버스 도착 정보 앱",
  // iOS에서 홈 화면에 추가하면 주소창 없이 앱처럼 열립니다.
  appleWebApp: {
    capable: true,
    title: "버스어딨니",
    // black-translucent + viewport-fit=cover로 헤더를 상태 표시줄까지 늘리는 방식은 iOS 26.1에서 막혔습니다.
    // 홈 화면 앱이 그 자리를 그리지 않고 밝은 블러로 덮어, 검은 헤더 위에 회색 그라데이션이 생깁니다.
    // https://bugs.webkit.org/show_bug.cgi?id=301994 가 고쳐지면 다시 시도해 볼 수 있습니다.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={manrope.variable}>
      {/* 바탕·글자색·한글 글꼴은 globals.css의 앱 토큰(tt-, --font-sans)입니다. */}
      <body className="bg-tt-ground font-sans text-tt-ink antialiased">
        {children}
      </body>
    </html>
  );
}
