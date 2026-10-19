import { ArrivalBoard } from "@/components/arrival-board";
import { getDefaultProfileStops } from "@/lib/profiles";

/**
 * 슬러그 없이 들어오면 기본 프로필을 보여줍니다. 이미 홈 화면에 추가된 아이콘(start_url: "/")이 여기로 옵니다.
 */
export default function Home() {
  return <ArrivalBoard stops={getDefaultProfileStops()} />;
}
