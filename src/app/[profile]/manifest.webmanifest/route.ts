import { buildManifest } from "@/lib/app-manifest";
import { profileStaticParams } from "@/lib/profiles";

// favorites.json에 없는 슬러그는 404입니다.
export const dynamicParams = false;

export const generateStaticParams = profileStaticParams;

/**
 * 프로필별 웹 매니페스트. app/manifest.ts는 app 루트에만 둘 수 있어서 Route Handler로 만듭니다.
 */
export async function GET(
  _req: Request,
  { params }: RouteContext<"/[profile]/manifest.webmanifest">,
) {
  const { profile } = await params;
  return Response.json(buildManifest(`/${profile}`), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
