import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { createSessionStore, SESSION_VERSION, type SessionRedis } from "../auth/session-store";

function fakeRedis() {
  const values = new Map<string, string>();

  const client: SessionRedis = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => void values.set(key, value),
    del: async (key) => void values.delete(key),
  };

  return { client, values };
}

const payload = {
  header: { iat: 0, uat: 0, exp: Math.floor(Date.now() / 1000) + 3600 },
  cookie: { expires: 0, maxAge: 3600 },
  data: {
    id_token: "token",
    access_token: "access",
    refresh_token: "refresh",
    token_type: "Bearer",
    expires_at: "0",
    sessionExpiresAt: 0,
    groups: ["digit"],
    is_admin: false,
  },
};

function get(store: ReturnType<typeof createSessionStore>, sid: string) {
  return new Promise<unknown>((resolve, reject) =>
    store.get(sid, (error, value) => (error ? reject(error) : resolve(value))),
  );
}

describe("session store", () => {
  it("round-trips a session written by the current build", async () => {
    const { client } = fakeRedis();
    const store = createSessionStore(client);

    await new Promise<void>((resolve) => store.set("sid", payload, () => resolve()));

    assert.deepEqual(await get(store, "sid"), {
      header: payload.header,
      cookie: payload.cookie,
      data: { id_token: "token", sessionExpiresAt: 0, groups: ["digit"], is_admin: false },
    });
  });

  it("discards sessions written without the current version", async () => {
    const { client, values } = fakeRedis();
    const store = createSessionStore(client);

    values.set("bookit:oidc:old", JSON.stringify(payload));
    values.set("bookit:oidc:older", JSON.stringify({ ...payload, version: SESSION_VERSION - 1 }));

    assert.equal(await get(store, "old"), null);
    assert.equal(await get(store, "older"), null);
  });
});
