import { describe, expect, it, vi } from "vitest";
import { singleFlight } from "@/lib/single-flight";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe("singleFlight", () => {
  it("진행 중에 다시 부르면 새로 실행하지 않고 진행 중인 실행을 함께 기다린다", async () => {
    const run = deferred();
    const fn = vi.fn(() => run.promise);
    const guarded = singleFlight(fn);

    const a = guarded();
    const b = guarded();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(b).toBe(a);

    run.resolve();
    await a;
  });

  it("앞선 실행이 끝나면 다시 실행한다", async () => {
    const fn = vi.fn(async () => {});
    const guarded = singleFlight(fn);

    await guarded();
    await guarded();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("앞선 실행이 실패해도 다음 호출은 다시 실행한다", async () => {
    const fn = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce();
    const guarded = singleFlight(fn);

    await expect(guarded()).rejects.toThrow("boom");
    await guarded();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
