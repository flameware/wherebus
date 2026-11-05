import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";

describe("contrastRatio", () => {
  it("검정과 흰색은 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it.each(["#000000", "#ffffff", "#E60012"])("같은 색(%s)은 1:1", (color) => {
    expect(contrastRatio(color, color)).toBeCloseTo(1, 5);
  });

  it("앞뒤 순서를 바꿔도 같다", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  // 흰 바탕에서 AA(4.5:1)를 넘는 가장 밝은 회색으로 알려진 값입니다(WebAIM Contrast Checker).
  it("#767676과 흰색은 4.54:1", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});
