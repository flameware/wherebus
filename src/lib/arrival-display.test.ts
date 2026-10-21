import { describe, expect, it } from "vitest";
import { formatAgo, formatMinutes, minutesLeft } from "@/lib/arrival-display";
import { BusArrival } from "@/lib/types";

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
