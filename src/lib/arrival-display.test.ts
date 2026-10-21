import { contrastRatio } from "@flameware/tokens/ramp";
import { describe, expect, it } from "vitest";
import {
  arrivalEmphasis,
  routeBadgeColors,
  formatAgo,
  formatMinutes,
  minutesLeft,
} from "@/lib/arrival-display";
import { BusArrival, RouteType } from "@/lib/types";

const arrival = (predictTime: number): BusArrival => ({
  predictTime,
  locationNo: 3,
  plateNo: "경기70바1234",
  stationNm: "판교역",
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

  it("0분 아래로 내려가지 않는다", () => {
    expect(minutesLeft(arrival(2), receivedAt, receivedAt + 10 * 60_000)).toBe(0);
  });
});

describe("formatMinutes", () => {
  it.each([
    [0, "곧 도착"],
    [2, "곧 도착"],
    [3, "3분"],
    [15, "15분"],
  ])("%i분 → %s", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
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
    expect(arrivalEmphasis(minutes, "first")).toBe(expected);
  });

  it.each([0, 2, 3, 14, 15, 40])("두 번째 차는 %i분이어도 secondary", (minutes) => {
    expect(arrivalEmphasis(minutes, "second")).toBe("secondary");
  });
});

describe("routeBadgeColors", () => {
  // 노선 번호는 굵은 큰 글씨라서 WCAG 큰 텍스트 기준 3:1을 요구합니다.
  const MIN_CONTRAST = 3;

  it.each([
    ["직행좌석", "#E60012"],
    ["좌석", "#0068B7"],
    ["일반", "#00A05A"],
    ["마을", "#F2A900"],
  ] as [RouteType, string][])("%s 배지는 노선 색 %s 위에서 글자가 읽힌다", (routeType, routeColor) => {
    const { background, foreground } = routeBadgeColors(routeType);
    expect(background).toBe(routeColor);
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it("마을 배지는 검정 글자", () => {
    expect(routeBadgeColors("마을").foreground).toBe("#000000");
  });
});
