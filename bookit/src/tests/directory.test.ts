import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, vi } from "vite-plus/test";
import { cached } from "../gamma/directory";

describe("cached", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shares one request between concurrent lookups", async () => {
    const fetch = vi.fn<() => Promise<string>>(async () => "digIT");
    const cache = cached(fetch);

    assert.deepEqual(await Promise.all([cache.get("a"), cache.get("a")]), ["digIT", "digIT"]);
    assert.equal(fetch.mock.calls.length, 1);
  });

  it("serves the stale value while refreshing, and keeps it if the refresh fails", async () => {
    const fetch = vi.fn<() => Promise<string>>().mockResolvedValueOnce("old");
    const cache = cached(fetch);

    await cache.get("a");
    vi.advanceTimersByTime(11 * 60 * 1000);
    fetch.mockRejectedValueOnce(new Error("Gamma down"));

    assert.equal(await cache.get("a"), "old");
    await vi.runAllTimersAsync();
    assert.equal(await cache.get("a"), "old");
    assert.equal(fetch.mock.calls.length, 2);

    vi.advanceTimersByTime(31 * 1000);
    fetch.mockResolvedValueOnce("new");
    await cache.get("a");
    await vi.runAllTimersAsync();
    assert.equal(await cache.get("a"), "new");
  });

  it("waits before retrying a first lookup that failed", async () => {
    const fetch = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("Gamma down"));
    const cache = cached(fetch);

    await assert.rejects(cache.get("a"), /Gamma down/);
    await assert.rejects(cache.get("a"), /Gamma down/);
    assert.equal(fetch.mock.calls.length, 1);

    vi.advanceTimersByTime(31 * 1000);
    fetch.mockResolvedValueOnce("digIT");
    assert.equal(await cache.get("a"), "digIT");
  });

  it("caches null results", async () => {
    const fetch = vi.fn<() => Promise<null>>(async () => null);
    const cache = cached(fetch);

    await cache.get("a");
    assert.equal(await cache.get("a"), null);
    assert.equal(fetch.mock.calls.length, 1);
  });
});
