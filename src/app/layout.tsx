import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_THEME_COLOR } from "@/lib/app-icon";

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
    <html lang="ko">
      {/* 글꼴은 globals.css가 로드하는 Pretendard이고, --font-sans는 디자인 시스템 정의를 따릅니다. */}
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
