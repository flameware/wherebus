import type { MetadataRoute } from "next";
import { APP_THEME_COLOR } from "@/lib/app-icon";

/**
 * 웹 매니페스트. 프로필마다 홈 화면 아이콘이 열 주소(start_url)만 다릅니다.
 */
export const buildManifest = (startUrl: string): MetadataRoute.Manifest => ({
  name: "버스어딨니",
  short_name: "버스어딨니",
  description: "자주 타는 버스의 실시간 도착 정보",
  start_url: startUrl,
  display: "standalone",
  background_color: "#f3f4f6",
  theme_color: APP_THEME_COLOR,
  icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
});
