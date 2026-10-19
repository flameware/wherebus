import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrivalBoard } from "@/components/arrival-board";
import { getProfileStops, profileStaticParams } from "@/lib/profiles";

// favorites.json에 없는 슬러그는 404입니다.
export const dynamicParams = false;

export const generateStaticParams = profileStaticParams;

/**
 * 홈 화면에 추가했을 때 이 프로필로 열리도록, 프로필별 매니페스트를 가리킵니다.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[profile]">): Promise<Metadata> {
  const { profile } = await params;
  return { manifest: `/${profile}/manifest.webmanifest` };
}

export default async function ProfilePage({
  params,
}: PageProps<"/[profile]">) {
  const { profile } = await params;
  const stops = getProfileStops(profile);
  if (!stops) notFound();
  return <ArrivalBoard stops={stops} />;
}
