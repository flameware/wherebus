---
status: accepted
---

# massive-design을 걷어내고 시간표 토큰으로 그린다

화면을 "터미널 운행시간표" 디자인(#25)으로 바꾸면서 massive-design(`@flameware/ui`, `@flameware/tokens`)을 걷어내고, 화면 색과 폰트를 `globals.css`의 Tailwind 4 `@theme` 앱 토큰(`tt-` 접두사)으로 정하기로 했다. [ADR-0001](./0001-massive-design-adoption.md)을 대체한다. 시간표 화면은 카드, 배너, 버튼 같은 디자인 시스템 컴포넌트를 쓰지 않고 남은 것은 `cn`과 검정·흰색 상수 정도였는데, 그 몇 줄을 위해 GitHub Packages 토큰(`NPM_TOKEN`)을 로컬과 배포 환경에 두고 만료를 관리하는 비용이 더 컸다.

## Consequences

- 설치와 배포에 `NPM_TOKEN`과 `.npmrc`가 필요 없다. 의존은 공개 npm 레지스트리뿐이다.
- 디자인 시스템이 주던 것을 앱이 직접 진다: `--font-sans`(Pretendard 스택), 화면이 쓰는 글자 크기 단계(`text-xs`, `text-xl`, `text-2xl`)의 행간·자간, `body`의 바탕과 글자색. preflight는 Tailwind 기본을 그대로 쓴다.
- 노선 칸 글자색 대비 검증은 앱의 WCAG 대비 함수(`src/lib/contrast.ts`)로 한다.
- 다크 모드는 없다. 다시 넣으려면 `tt-` 토큰에 다크 값을 더해야 한다.
- 다른 앱과 화면 요소를 나눠 쓸 일이 생기면 그때 디자인 시스템을 다시 검토한다. 노선 색은 그때도 앱에 둔다(ADR-0001과 같은 이유).
