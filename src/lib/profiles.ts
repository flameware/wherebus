// 다른 프로필의 정류장이 브라우저로 내려가지 않도록, 클라이언트 컴포넌트에서 import하면 빌드가 실패합니다.
import "server-only";
import type { FavoriteStop } from "@/lib/types";

// 즐겨찾기 설정 파일
import favoritesData from "@/lib/favorites.json";

/**
 * src/lib/favorites.json의 모양. 프로필 슬러그마다 정류장 목록을 가집니다.
 */
interface FavoritesConfig {
  defaultProfile: string; // 슬러그 없이 /로 들어왔을 때 보여줄 프로필
  profiles: Record<string, FavoriteStop[]>;
}

// JSON의 priorityHours는 number[]로 추론되어 튜플 타입과 바로 맞지 않습니다.
const config = favoritesData as unknown as FavoritesConfig;

// 기본 프로필 이름을 잘못 적으면 /가 404가 되므로, 빌드 단계에서 바로 실패시킵니다.
if (!Object.hasOwn(config.profiles, config.defaultProfile)) {
  throw new Error(
    `favorites.json의 defaultProfile "${config.defaultProfile}"이 profiles에 없습니다.`,
  );
}

/**
 * 기본 프로필의 정류장 목록. 기본 프로필은 위에서 있는지 확인했으므로 항상 있습니다.
 */
export const getDefaultProfileStops = () =>
  config.profiles[config.defaultProfile];

/**
 * 프로필 경로(/[profile]/...)의 generateStaticParams. 페이지와 매니페스트가 같은 슬러그 목록을 쓰도록 공유합니다.
 */
export const profileStaticParams = () =>
  Object.keys(config.profiles).map((profile) => ({ profile }));

/**
 * 프로필의 정류장 목록을 반환합니다. 없는 프로필이면 undefined입니다.
 */
export const getProfileStops = (slug: string): FavoriteStop[] | undefined =>
  Object.hasOwn(config.profiles, slug) ? config.profiles[slug] : undefined;
