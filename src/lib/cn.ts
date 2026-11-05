/**
 * 조건부 className을 공백으로 잇습니다. 거짓 값은 뺍니다.
 * 겹치는 유틸리티를 정리하지는 않으므로(tailwind-merge 아님), 한 호출 안에 서로 덮는 클래스를 두지 않습니다.
 */
export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");
