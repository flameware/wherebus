import { ROUTE_COLORS } from "@/lib/arrival-display";

export const APP_THEME_COLOR = ROUTE_COLORS["일반"];

/**
 * 앱 아이콘 그림. 초록 바탕에 흰 버스와, 도착 화면의 트랙(점 두 개와 내 정류장)을 그립니다.
 * next/og의 ImageResponse로 렌더링하므로 flex 레이아웃만 씁니다.
 */
export function AppIcon({ size }: { size: number }) {
  const u = size / 100; // 100 단위 격자

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: APP_THEME_COLOR,
      }}
    >
      {/* 버스 몸체 */}
      <div
        style={{
          width: 52 * u,
          height: 46 * u,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "white",
          borderRadius: 10 * u,
          paddingTop: 7 * u,
        }}
      >
        {/* 앞 유리 */}
        <div
          style={{
            width: 40 * u,
            height: 17 * u,
            background: APP_THEME_COLOR,
            borderRadius: 4 * u,
          }}
        />
        {/* 전조등 */}
        <div
          style={{
            width: 40 * u,
            display: "flex",
            justifyContent: "space-between",
            marginTop: 7 * u,
          }}
        >
          <div style={{ width: 7 * u, height: 7 * u, borderRadius: 7 * u, background: APP_THEME_COLOR }} />
          <div style={{ width: 7 * u, height: 7 * u, borderRadius: 7 * u, background: APP_THEME_COLOR }} />
        </div>
      </div>

      {/* 트랙: 다가오는 버스 두 대와 내 정류장 */}
      <div
        style={{
          width: 64 * u,
          height: 10 * u,
          marginTop: 9 * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 4 * u,
            height: 2 * u,
            background: "rgba(255,255,255,0.5)",
          }}
        />
        <div style={{ width: 7 * u, height: 7 * u, borderRadius: 7 * u, background: "rgba(255,255,255,0.6)" }} />
        <div style={{ width: 8 * u, height: 8 * u, borderRadius: 8 * u, background: "white" }} />
        <div
          style={{
            width: 10 * u,
            height: 10 * u,
            borderRadius: 10 * u,
            border: `${2.5 * u}px solid white`,
            background: APP_THEME_COLOR,
          }}
        />
      </div>
    </div>
  );
}
