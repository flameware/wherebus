/** 시·분을 두 자리로 맞춥니다. 예: 8 → "08". */
export const padTwo = (n: number) => String(n).padStart(2, "0");
