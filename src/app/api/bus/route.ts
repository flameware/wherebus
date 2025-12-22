import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, BusArrivalInfo } from "@/lib/types";

const API_BASE_URL = "http://apis.data.go.kr/1613000/ArvlInfoInqireService";

/**
 * 정류소 ID와 노선 ID를 기반으로 특정 노선의 도착 정보를 직접 조회합니다.
 * @param req NextRequest
 * @returns NextResponse
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityCode = searchParams.get("cityCode");
  const nodeId = searchParams.get("nodeId");
  const routeId = searchParams.get("routeId");

  if (!cityCode || !nodeId || !routeId) {
    return NextResponse.json(
      { error: "cityCode, nodeId, and routeId are required" },
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

  // 1. 정류소의 특정 노선 도착 정보를 직접 요청 (더 효율적인 엔드포인트 사용)
  const API_ENDPOINT = "/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList";
  const query = new URLSearchParams({
    cityCode,
    nodeId,
    routeId,
    _type: "json",
    numOfRows: "10", // 특정 노선만 조회하므로 많은 데이터가 필요 없음
  });
  const serviceUrl = `${API_BASE_URL}${API_ENDPOINT}?${query.toString()}&serviceKey=${apiKey}`;

  try {
    const apiRes = await fetch(serviceUrl);

    if (!apiRes.ok) {
      throw new Error(`API call failed with status: ${apiRes.status}`);
    }

    const jsonData: ApiResponse<BusArrivalInfo> = await apiRes.json();
    const resultCode = jsonData.response.header.resultCode;
    const totalCount = jsonData.response.body.totalCount;

    if (resultCode !== "00") {
      throw new Error(
        `API Error: ${jsonData.response.header.resultMsg} (Code: ${resultCode})`,
      );
    }

    if (totalCount === 0 || !jsonData.response.body.items) {
      return NextResponse.json(
        { message: "해당 정류소에 도착 예정인 버스가 없습니다." },
        { status: 404 },
      );
    }

    const items = Array.isArray(jsonData.response.body.items.item)
      ? jsonData.response.body.items.item
      : [jsonData.response.body.items.item];

    // 2. 가장 빨리 도착하는 버스를 선택 (보통 하나만 오지만, 여러 대가 오는 경우를 대비)
    const arrivalInfo = items.reduce((prev, current) => {
      return prev.arrtime < current.arrtime ? prev : current;
    });

    return NextResponse.json(arrivalInfo);
  } catch (error) {
    console.error("API call failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from the external API." },
      { status: 502 },
    );
  }
}
