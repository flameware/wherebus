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
