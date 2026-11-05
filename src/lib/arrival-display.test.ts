import { contrastRatio } from "@/lib/contrast";
import { describe, expect, it } from "vitest";
import {
  arrivalEmphasis,
  routeCellColors,
  formatAgo,
  minutesLeft,
  splitRouteName,
  stopsAwayLabel,
  trackCellIndex,
} from "@/lib/arrival-display";
import { BusArrival, RouteType } from "@/lib/types";

const arrival = (predictTime: number): BusArrival => ({
  predictTime,
  locationNo: 3,
});

describe("minutesLeft", () => {
  const receivedAt = 1_000_000;

  it.each([
    [0, 7],
    [59_999, 7],
    [60_000, 6],
    [3 * 60_000 + 30_000, 4],
  ])("받은 뒤 %ims 지나면 7분 → %i분", (elapsed, expected) => {
    expect(minutesLeft(arrival(7), receivedAt, receivedAt + elapsed)).toBe(expected);
  });

  it("화면 시각이 받은 시각보다 조금 앞서도 늘어나지 않는다", () => {
    expect(minutesLeft(arrival(7), receivedAt, receivedAt - 500)).toBe(7);
  });

  it("0분 아래로 내려가지 않는다", () => {
    expect(minutesLeft(arrival(2), receivedAt, receivedAt + 10 * 60_000)).toBe(0);
  });
});

describe("formatAgo", () => {
  it.each([
    [-500, "0초 전"],
    [0, "0초 전"],
    [59_999, "59초 전"],
    [60_000, "1분 전"],
    [125_000, "2분 전"],
  ])("%ims → %s", (ms, expected) => {
    expect(formatAgo(ms)).toBe(expected);
  });
});

describe("arrivalEmphasis", () => {
  it.each([
    [0, "imminent"],
    [2, "imminent"],
    [3, "normal"],
    [14, "normal"],
    [15, "far"],
    [40, "far"],
  ] as const)("첫 차 %i분 → %s", (minutes, expected) => {
    expect(arrivalEmphasis(minutes)).toBe(expected);
  });
});

describe("routeCellColors", () => {
  // 노선 번호는 굵은 큰 글씨라서 WCAG 큰 텍스트 기준 3:1을 요구합니다.
  const MIN_CONTRAST = 3;

  it.each([
    ["직행좌석", "#E60012"],
    ["좌석", "#0068B7"],
    ["일반", "#00A05A"],
    ["마을", "#F2A900"],
  ] as [RouteType, string][])("%s 노선 칸은 노선 색 %s 위에서 글자가 읽힌다", (routeType, routeColor) => {
    const { background, foreground } = routeCellColors(routeType);
    expect(background).toBe(routeColor);
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it("마을 노선 칸은 검정 글자", () => {
    expect(routeCellColors("마을").foreground).toBe("#000000");
  });
});

describe("trackCellIndex", () => {
  // 칸 0이 10정거장 전(왼쪽 끝), 칸 9가 내 정류장 바로 앞입니다.
  it.each([
    [0, 9],
    [1, 9],
    [2, 8],
    [9, 1],
    [10, 0],
    [11, 0],
    [25, 0],
  ])("%i정거장 전 → %i번 칸", (locationNo, expected) => {
    expect(trackCellIndex(locationNo)).toBe(expected);
  });
});

describe("stopsAwayLabel", () => {
  it.each([
    [0, "full", "진입 중"],
    [0, "short", "진입 중"],
    [1, "full", "1정거장 전"],
    [1, "short", "1정거장"],
    [12, "full", "12정거장 전"],
    [12, "short", "12정거장"],
  ] as const)("%i정거장 남음(%s) → %s", (locationNo, form, expected) => {
    expect(stopsAwayLabel(locationNo, form)).toBe(expected);
  });
});

describe("splitRouteName", () => {
  it("괄호 안을 번호 아래에 쓸 보조 표기로 나눈다", () => {
    expect(splitRouteName("1007(예약)")).toEqual({ number: "1007", suffix: "예약" });
  });

  it("괄호가 없으면 번호만 있다", () => {
    expect(splitRouteName("4000")).toEqual({ number: "4000" });
  });
});
