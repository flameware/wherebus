# massive-design 전환 분석

2026-10-21. 지금 화면 UI를 [massive-design](../../../massive-design/)(`@flameware/ui`·`@flameware/tokens` 0.9.0)으로 모두 옮길 수 있는지, 빈 부분이 무엇인지 정리한 문서입니다. 결정 근거는 [ADR-0001](../adr/0001-massive-design-adoption.md), 용어는 [`GLOSSARY.md`](../../GLOSSARY.md)를 따릅니다.

**결론**: 차단 요소 없이 전부 전환할 수 있습니다. 범용 요소는 디자인 시스템으로 대체하고, 노선 색과 도착 트랙 같은 도메인 요소는 앱에 남깁니다.

## 전제

- **범위**: 화면 안의 UI(컴포넌트, 레이아웃, 타이포, 색)만 다룹니다. 다크 모드, 모션, 앱 아이콘, 매니페스트는 제외합니다.
- **산출물**: 분석만 합니다. 실제 전환은 하지 않습니다.
- **배치 원칙**: 범용 요소는 massive-design, 버스 도메인 요소는 wherebus.
- **시각 원칙**: 디자인 시스템 룩을 따르되, 정보를 담은 색(노선 색)은 예외로 지킵니다.

## 대응표

| 지금 UI | 전환 대상 | 비고 |
|---|---|---|
| 페이지 `bg-gray-100`, 카드 `bg-white` | `bg-canvas`, `bg-surface` | |
| 콘텐츠 컬럼과 헤더 | `PageShell` (`contentWidthClassName="max-w-md"`, nav 없음) | 헤더에 `border-b`와 surface 배경이 생깁니다 |
| 정류장 카드 | `Card.Root/Header/Title/Body` | radius 18px → 10px |
| 앱 제목, 별칭 | `Heading level={1} size="2xl"`, `Heading level={2} size="lg"` | |
| 정식 정류장명, 상태 문구 | `Text size="xs" tone="muted"`, `tone="danger"` | |
| 설정 없음 상태 | `EmptyState` 또는 `Alert tone="neutral"` | |
| 전체 실패 배너 + "다시 시도" | `Alert tone="danger"` 안에 `Button variant="link"`를 앱에서 조립 | Alert에 액션 칸이 없습니다 |
| 노선 행 로딩 | `Skeleton announce={false}` | |
| 지난 정보 배지 | `Badge tone="warning"` | 10px → 12px |
| 신선도 점 (초록/주황/파랑) | `bg-success-solid`, `bg-warning-solid`, `bg-accent-solid` | 점은 앱에서 span으로 그립니다 |
| 신선도 알약 (갱신 지연이면 주황) | `Button variant="secondary" size="sm"` + rounded-full, 주황은 `--ds-state-base`를 warning-soft로 | `bg-*`를 덮어쓰지 않습니다 |
| 노선 번호 배지 | 앱 전용 | 마을(노랑)만 검정 글자 |
| 도착 트랙 | 앱 전용, 내부 회색과 강조색만 토큰으로 | `Progress`는 마커가 하나라 맞지 않습니다 |
| 당겨서 새로고침 스피너 | 앱 전용 | 디자인 시스템 `Spinner`는 원호형뿐입니다 |
| iOS 26 sticky 띠, overscroll 처리 | 앱 전용 | |
| Geist (라틴 전용) | Pretendard를 앱이 직접 로드 | 한글 폴백 문제가 해결됩니다 |

## 토큰 결정

- **회색 위계**: `gray-400`/`gray-500` 구분을 `text-muted` 하나로 합치고, 덜 중요한 정보(두 번째 차, 15분 이상, 보조 문구)는 opacity로 낮춥니다.
- **작은 글자**: `text-[11px]`, `text-[10px]`은 `text-xs`(12px)로 올립니다.
- **노선 배지 대비**: 흰 글자에 대한 대비가 마을 `#F2A900` 약 2.0:1, 일반 `#00A05A` 약 3.4:1입니다. 마을만 검정 글자로 바꿉니다.
- **브랜드 색**: 디자인 시스템 기본 파랑 `#0f5fed`. 초록으로 하면 일반 노선 색과 겹칩니다.

## 전환 전 준비

1. `.npmrc`에 `@flameware:registry=https://npm.pkg.github.com`와 `FLAMEWARE_PACKAGES_TOKEN`(`read:packages`)을 설정합니다. 로컬과 배포 환경 모두 필요합니다.
2. `globals.css`의 shadcn 토큰과 `@theme inline`, `src/components/ui/*`, `components.json`을 제거합니다. 남기면 `--font-sans`와 `--radius-*`가 충돌합니다.
3. 쓰지 않는 `lucide-react`(0.562)를 제거하거나, 디자인 시스템 peer 요구에 맞춰 ^1.0으로 올립니다.
4. 레지스트리 설치만 씁니다. Next 16 Turbopack은 `file:`/`bun link` 심볼릭 링크의 subpath를 찾지 못합니다.
5. `Toast`, `Dialog`처럼 점 표기를 쓰는 컴파운드 컴포넌트를 서버 컴포넌트에서 쓰려면 앱에 `"use client"` 래퍼가 필요합니다. 지금 화면에는 해당하지 않습니다.

## massive-design 후보 (지금은 올리지 않음)

- **PullToRefresh**: 사용처가 wherebus 하나뿐이고 iOS 전용 우회가 섞여 있습니다.
- **Alert.Action**: 다른 앱에서 같은 조립이 반복되면 요청합니다.

## 범위 밖 참고

- PRD §3.8은 다크 모드를 지원한다고 적지만 구현되어 있지 않습니다. 시맨틱 토큰으로 옮기면 `<html class="dark">` 토글만으로 대부분 해결됩니다.
