import { NextRequest, NextResponse } from "next/server";
import {
  BusArrival,
  GbisBusArrivalItem,
  GbisResponse,
  RouteArrival,
} from "@/lib/types";

const API_BASE_URL = "https://apis.data.go.kr/6410000/busarrivalservice/v2";

// GBIS 응답 캐시 시간 (초)
const CACHE_SECONDS = 20;

/**
 * TAGO 형식의 ID(예: GGB206000637)를 GBIS ID(206000637)로 변환합니다.
 */
const toGbisId = (id: string) => id.replace(/^GGB/, "");

/**
 * GBIS 응답의 n번째 차량 정보를 꺼냅니다. 해당 차량이 없으면 null을 반환합니다.
 */
const toBusArrival = (
  item: GbisBusArrivalItem,
  n: 1 | 2,
): BusArrival | null => {
  const predictTime = item[`predictTime${n}`];
  const locationNo = item[`locationNo${n}`];
  if (predictTime === "" || locationNo === "") {
    return null;
  }
  return { predictTime, locationNo };
};

/**
 * 정류소 ID와 노선 ID를 기반으로 경기도 버스도착정보(GBIS)에서 도착 정보를 조회합니다.
 * 정류소의 전체 도착 목록을 받아 해당 노선만 골라냅니다.
 * @param req NextRequest
 * @returns NextResponse
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get("nodeId");
  const routeId = searchParams.get("routeId");

  if (!nodeId || !routeId) {
    return NextResponse.json(
      { error: "nodeId and routeId are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (!apiKey) {
    console.error("DATA_GO_KR_API_KEY is not set in .env.local");
    return NextResponse.json(
      { error: "API key is not configured on the server." },
      { status: 500 },
    );
  }

  const API_ENDPOINT = "/getBusArrivalListv2";
  const query = new URLSearchParams({
    stationId: toGbisId(nodeId),
    format: "json",
  });
  const serviceUrl = `${API_BASE_URL}${API_ENDPOINT}?${query.toString()}&serviceKey=${apiKey}`;

  try {
    // GBIS 일일 호출 한도(10,000건)를 지키기 위해 접속자 수와 관계없이
    // 정류장별로 20초에 최대 1번만 호출합니다. 같은 정류장의 노선들은 캐시를 함께 씁니다.
    const apiRes = await fetch(serviceUrl, {
      next: { revalidate: CACHE_SECONDS },
    });

    if (!apiRes.ok) {
      throw new Error(`API call failed with status: ${apiRes.status}`);
    }

    const jsonData: GbisResponse<GbisBusArrivalItem> = await apiRes.json();
    const { resultCode, resultMessage } = jsonData.response.msgHeader;

    // 4: 결과 없음 (정류소에 해당 노선이 없거나 운행 정보가 없음)
    if (resultCode === 4 || !jsonData.response.msgBody) {
      return NextResponse.json(
        { error: `No arrival data: ${resultMessage}` },
        { status: 404 },
      );
    }

    if (resultCode !== 0) {
      throw new Error(`API Error: ${resultMessage} (Code: ${resultCode})`);
    }

    // 결과가 하나면 배열이 아닌 객체로 옵니다.
    const items = [jsonData.response.msgBody.busArrivalList].flat();
    const item = items.find((i) => String(i.routeId) === toGbisId(routeId));

    // 지금 정류소에 오는 차량이 없는 노선은 목록에서 빠지므로 도착 예정 버스가 없는 상태로 돌려줍니다.
    if (!item) {
      return NextResponse.json({ arrivals: [] } satisfies RouteArrival);
    }

    const routeArrival: RouteArrival = {
      routeName: String(item.routeName),
      routeDestName: item.routeDestName,
      arrivals: [toBusArrival(item, 1), toBusArrival(item, 2)].filter(
        (arrival): arrival is BusArrival => arrival !== null,
      ),
    };

    return NextResponse.json(routeArrival);
  } catch (error) {
    console.error("API call failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from the external API." },
      { status: 502 },
    );
  }
}
