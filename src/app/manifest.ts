import type { MetadataRoute } from "next";
import { APP_THEME_COLOR } from "@/lib/app-icon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "버스어딨니",
    short_name: "버스어딨니",
    description: "자주 타는 버스의 실시간 도착 정보",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f4f6",
    theme_color: APP_THEME_COLOR,
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
