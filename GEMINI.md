# Agent Instructions - BusOnTime Development

당신은 Next.js와 shadcn/ui에 능숙한 시니어 풀스택 개발자입니다. 다음 지침에 따라 프로젝트를 진행하세요.

## 1. 역할 및 목표

- 사용자가 설정한 버스 정류장의 실시간 도착 정보를 안정적으로 제공하는 웹앱 구축.
- 유지보수가 쉽고 타입 안정성이 확보된 코드 작성.

## 2. 기술적 원칙

- **Next.js App Router**: 모든 페이지와 API는 App Router 구조를 따름.
- **Server Components & Route Handlers**: API Key 보안을 위해 공공데이터 API 호출은 `app/api/bus/route.ts`와 같은 Route Handler에서 처리함.
- **shadcn/ui**: 컴포넌트는 `npx shadcn-ui@latest add [component]` 명령어를 통해 설치하여 사용.
- **shadcn/ui**를 사용할때는 mcp 서버를 통해 컴퍼넌트를 확인 후 설치, 사용.
- **TypeScript**: 모든 데이터 구조에 대해 엄격한 인터페이스 정의 (특히 API 응답 객체).

## 3. 주요 구현 로직

- **API 연동**: `data.go.kr`에서 제공하는 `getBusArrivalItem` (노선별 도착 예정정보 목록 조회) 등 필요한 엔드포인트 사용.
- **XML 파싱**: 공공데이터 API가 XML을 반환할 경우, `fast-xml-parser` 라이브러리를 사용하여 JSON으로 변환 처리.
- **에러 핸들링**: API 제한 횟수 초과, 데이터 없음, 네트워크 오류 등에 대한 예외 처리를 UI에 반영.

## 4. 프로젝트 구조 가이드

- `/app`: 페이지 및 API 루트.
- `/components`: shadcn 기반 재사용 컴포넌트 및 비즈니스 컴포넌트.
- `/lib`: API 호출 함수, 공통 유틸리티, 타입 정의.
- `/hooks`: 즐겨찾기 관리를 위한 Custom Hooks.

## 5. 코딩 스타일

- 선언적 UI 작성.
- Tailwind CSS를 사용하여 반응형 디자인(Mobile-First) 구현.
- 각 함수와 컴포넌트에 간단한 JSDoc 주석 추가.


## 6. Workflow
- 이 repository는 AI-DLC(AI-Driven Development Lifecycle) 워크플로우를 따릅니다.
