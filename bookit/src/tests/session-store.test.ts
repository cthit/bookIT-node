import { describe, expect, it, vi } from "vite-plus/test";
import { createSessionStore, type SessionRedis } from "../auth/session-store";

describe("OIDC session storage", () => {
  it("stores a bounded session without access or refresh tokens", async () => {
    const client = {
      get: vi.fn<SessionRedis["get"]>(),
      set: vi.fn<SessionRedis["set"]>().mockResolvedValue("OK"),
      del: vi.fn<SessionRedis["del"]>().mockResolvedValue(1),
    };
    const store = createSessionStore(client);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      header: { iat: now, uat: now, exp: now + 120 },
      cookie: { expires: (now + 120) * 1000, maxAge: 120_000 },
      data: {
        token_type: "Bearer",
        expires_at: String(now + 120),
        id_token: "id-token",
        access_token: "access-token",
        refresh_token: "refresh-token",
        groups: ["digit"],
        is_admin: false,
        sessionExpiresAt: now + 120,
      },
    };

    await new Promise<void>((resolve, reject) =>
      store.set("session", payload, (error) => (error ? reject(error) : resolve())),
    );
    const call = client.set.mock.calls[0]!;

    expect(call[0]).toBe("bookit:oidc:session");
    expect(JSON.parse(call[1]).data).toEqual({
      id_token: "id-token",
      groups: ["digit"],
      is_admin: false,
      sessionExpiresAt: now + 120,
    });
    expect(call[2].EX).toBeGreaterThan(0);
    expect(call[2].EX).toBeLessThanOrEqual(120);
  });

  it("treats missing and expired sessions as logged out and reports corrupt storage", async () => {
    const client = {
      get: vi.fn<SessionRedis["get"]>(),
      set: vi.fn<SessionRedis["set"]>(),
      del: vi.fn<SessionRedis["del"]>(),
    };
    const store = createSessionStore(client);
    const read = () =>
      new Promise((resolve, reject) =>
        store.get("session", (error, value) => (error ? reject(error) : resolve(value))),
      );

    client.get.mockResolvedValue(null);
    expect(await read()).toBeNull();
    client.get.mockResolvedValue(JSON.stringify({ header: { exp: 0 }, data: {} }));
    expect(await read()).toBeNull();
    client.get.mockResolvedValue("corrupt");
    await expect(read()).rejects.toThrow(SyntaxError);
    client.get.mockRejectedValue(new Error("Redis unavailable"));
    await expect(read()).rejects.toThrow("Redis unavailable");
  });
});
