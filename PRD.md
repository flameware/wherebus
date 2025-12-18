# Product Requirements Document (PRD) - BusOnTime (가칭)

## 1. 프로젝트 개요

사용자가 자주 이용하는 버스 정류장과 특정 노선의 실시간 도착 정보를 빠르게 확인할 수 있는 모바일 최적화 웹 애플리케이션입니다.

## 2. 타겟 사용자

- 매일 같은 정류장에서 특정 버스를 이용하는 직장인 및 학생.
- 복잡한 버스 앱 대신 필요한 정보만 빠르게 보고 싶은 사용자.

## 3. 핵심 기능 요구사항

### 3.1. 즐겨찾기 정류장 및 노선 관리

- 사용자가 자주 가는 정류장 ID와 버스노선 ID를 별도 json파일 저장을 통해 설정.

### 3.2. 실시간 도착 정보 조회

- 공공데이터포털(data.go.kr)의 '버스 정보 조회 서비스' API 연동.
- 선택한 정류장에 특정 버스가 몇 분 후 도착하는지 표시 (예: 5분 20초 후 [3정거장 전]).
- 새로고침 버튼을 통한 데이터 수동 갱신.

### 3.3. 모바일 최적화 UI/UX

- shadcn/ui를 활용한 깔끔하고 가독성 높은 카드 기반 UI.
- 한 손 조작이 편한 하단 내비게이션 또는 버튼 배치.
- 다크 모드 지원.

## 4. 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React (Icons)
- **Deployment**: Vercel
- **Data Fetching**: TanStack Query (선택 사항) 또는 Fetch API

## 5. 비기능적 요구사항

- **보안**: 공공데이터 API Key는 `.env` 파일로 관리하며, 클라이언트 측에 노출되지 않도록 Next.js Route Handlers(Server Side)를 통해 호출함.
- **성능**: API 응답 지연을 고려한 Loading Skeleton 적용.
- **정확성**: 공공데이터의 XML/JSON 응답을 정확하게 파싱하여 사용자에게 전달.
