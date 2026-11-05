/**
 * WCAG 2 대비. 노선 칸의 번호 글자색이 노선 색 위에서 읽히는지 확인하는 데 씁니다.
 * https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */

// "#rrggbb"의 WCAG 상대 휘도(0~1).
const relativeLuminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 두 "#rrggbb" 색의 대비(1~21). 순서는 상관없습니다. */
export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
