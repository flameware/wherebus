import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, BusArrivalInfo } from '@/lib/types';

const API_BASE_URL = 'http://apis.data.go.kr/1613000/ArvlInfoInqireService';

/**
 * 정류소 ID를 기반으로 모든 도착 정보를 가져온 후, 특정 노선 ID로 필터링하여 반환합니다.
 * @param req NextRequest
 * @returns NextResponse
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityCode = searchParams.get('cityCode');
  const nodeId = searchParams.get('nodeId');
  const routeId = searchParams.get('routeId'); // 필터링을 위해 여전히 필요

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

  // 1. 정류소의 모든 도착 정보를 요청
  const API_ENDPOINT = '/getSttnAcctoArvlPrearngeInfoList';
  const query = new URLSearchParams({
    cityCode,
    nodeId,
    _type: 'json',
    numOfRows: '100' // 혹시 모르니 받아오는 데이터 수 증가
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

    if (resultCode !== '00') {
      throw new Error(`API Error: ${jsonData.response.header.resultMsg} (Code: ${resultCode})`);
    }

    if (totalCount === 0 || !jsonData.response.body.items) {
      return NextResponse.json({ message: '해당 정류소에 도착 예정인 버스가 없습니다.' }, { status: 404 });
    }

    const items = Array.isArray(jsonData.response.body.items.item) 
      ? jsonData.response.body.items.item 
      : [jsonData.response.body.items.item];
    
    // 2. 받아온 전체 목록에서 원하는 routeId를 가진 모든 버스를 필터링
    const filteredBuses = items.filter(item => item.routeid === routeId);

    if (filteredBuses.length === 0) {
      console.log(`[Debug] RouteID ${routeId} not found in the arrival list for NodeID ${nodeId}.`);
      return NextResponse.json({ message: `해당 정류소에 ${routeId}번 버스 도착 정보가 없습니다.` }, { status: 404 });
    }
    
    // 3. 필터링된 버스들 중 arrtime이 가장 작은 (가장 빨리 도착하는) 버스를 선택
    const arrivalInfo = filteredBuses.reduce((prev, current) => {
        return (prev.arrtime < current.arrtime) ? prev : current;
    });
    
    return NextResponse.json(arrivalInfo);

  } catch (error) {
    console.error('API call failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the external API.' },
      { status: 502 }
    );
  }
}
