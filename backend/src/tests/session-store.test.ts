import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createSessionStore, type SessionRedis } from "../auth/session-store";

const redis = () => ({
  get: vi.fn<SessionRedis["get"]>(),
  set: vi.fn<SessionRedis["set"]>().mockResolvedValue("OK"),
  del: vi.fn<SessionRedis["del"]>().mockResolvedValue(1),
});

describe("OIDC Redis session adapter", () => {
  afterEach(() => vi.useRealTimers());

  it("stores session data using the OIDC expiration and invokes the callback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const client = redis();
    const store = createSessionStore(client);
    const payload: Parameters<typeof store.set>[1] = {
      header: { iat: 1000, uat: 1000, exp: 1060 },
      data: {
        id_token: "test",
        access_token: "test",
        refresh_token: "",
        token_type: "Bearer",
        expires_at: "1060",
      },
      cookie: { expires: 1_060_000, maxAge: 60_000 },
    };
    await new Promise<void>((resolve, reject) =>
      store.set("session", payload, (error) => (error ? reject(error) : resolve())),
    );
    expect(client.set).toHaveBeenCalledWith("bookit:oidc:session", JSON.stringify(payload), {
      EX: 60,
    });
  });

  it("does not restore an expired session even if the Redis key remains", async () => {
    const client = redis();
    client.get.mockResolvedValue(JSON.stringify({ header: { exp: 1 }, data: {} }));
    const store = createSessionStore(client);
    const value = await new Promise((resolve, reject) =>
      store.get("old", (error, session) => (error ? reject(error) : resolve(session))),
    );
    expect(value).toBeNull();
  });

  it("reports Redis errors instead of silently hanging an authentication request", async () => {
    const client = redis();
    client.get.mockRejectedValue(new Error("Redis unavailable"));
    const store = createSessionStore(client);
    await expect(
      new Promise((resolve, reject) =>
        store.get("session", (error, session) => (error ? reject(error) : resolve(session))),
      ),
    ).rejects.toThrow("Redis unavailable");
  });

  it("removes the session on logout", async () => {
    const client = redis();
    const store = createSessionStore(client);
    await new Promise<void>((resolve, reject) =>
      store.destroy("session", (error) => (error ? reject(error) : resolve())),
    );
    expect(client.del).toHaveBeenCalledWith("bookit:oidc:session");
  });
});
