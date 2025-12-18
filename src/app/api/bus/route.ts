import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, BusArrivalInfo } from '@/lib/types';

const API_BASE_URL = 'http://apis.data.go.kr/1613000/ArvlInfoInqireService';
const API_ENDPOINT = '/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList';

/**
 * 클라이언트의 요청을 받아 data.go.kr API로 전달하고 결과를 반환하는 API Route Handler
 * @param req NextRequest
 * @returns NextResponse
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityCode = searchParams.get('cityCode');
  const nodeId = searchParams.get('nodeId');
  const routeId = searchParams.get('routeId');

  if (!cityCode || !nodeId || !routeId) {
    return NextResponse.json(
      { error: 'cityCode, nodeId, and routeId are required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (!apiKey) {
    console.error('DATA_GO_KR_API_KEY is not set in .env.local');
    return NextResponse.json(
      { error: 'API key is not configured on the server.' },
      { status: 500 }
    );
  }

  // API 요청 URL 구성
  const query = new URLSearchParams({
    cityCode,
    nodeId,
    routeId,
    _type: 'json',
  });
  const serviceUrl = `${API_BASE_URL}${API_ENDPOINT}?${query.toString()}&serviceKey=${encodeURIComponent(apiKey)}`;

  try {
    const apiRes = await fetch(serviceUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!apiRes.ok) {
      throw new Error(`API call failed with status: ${apiRes.status}`);
    }

    const jsonData: ApiResponse<BusArrivalInfo> = await apiRes.json();
    const resultCode = jsonData.response.header.resultCode;
    const totalCount = jsonData.response.body.totalCount;

    if (resultCode !== '00') {
      throw new Error(`API Error: ${jsonData.response.header.resultMsg} (Code: ${resultCode})`);
    }

    if (totalCount === 0) {
      return NextResponse.json({ message: '도착 정보가 없습니다.' }, { status: 404 });
    }

    const items = jsonData.response.body.items.item;
    
    // API가 단일 항목 또는 배열을 반환할 수 있으므로 첫 번째 항목을 사용
    const arrivalInfo = Array.isArray(items) ? items[0] : items;
    
    return NextResponse.json(arrivalInfo);

  } catch (error) {
    console.error('API call failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the external API.' },
      { status: 502 }
    );
  }
}
