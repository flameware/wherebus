import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

// iOS "홈 화면에 추가" 아이콘. iOS가 모서리를 직접 둥글게 깎습니다.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={size.width} />, size);
}
