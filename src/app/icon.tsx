import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

// 홈 화면 아이콘과 PWA manifest 아이콘으로 씁니다.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIcon size={size.width} />, size);
}
