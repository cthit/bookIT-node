import type { ConfigParams } from "express-openid-connect";

type SessionConfig = Exclude<ConfigParams["session"], boolean | undefined>;

type OidcStore = NonNullable<SessionConfig["store"]>;

type Payload = Parameters<OidcStore["set"]>[1];

export interface SessionRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

export function createSessionStore(client: SessionRedis): OidcStore {
  const key = (sid: string) => `bookit:oidc:${sid}`;

  return {
    get(sid, callback) {
      void client
        .get(key(sid))
        .then((value) => {
          if (!value) {
            return null;
          }

          const payload = JSON.parse(value) as Payload;

          return payload.header.exp > Date.now() / 1000 ? payload : null;
        })
        .then(
          (payload) => callback(null, payload),
          (error: unknown) => callback(error),
        );
    },
    set(sid, payload, callback) {
      const ttl = Math.ceil(payload.header.exp - Date.now() / 1000);

      const stored = {
        ...payload,
        data: {
          id_token: payload.data.id_token,
          sessionExpiresAt: payload.data.sessionExpiresAt,
          groups: payload.data.groups,
          is_admin: payload.data.is_admin,
        },
      };

      const operation =
        ttl > 0 ? client.set(key(sid), JSON.stringify(stored), { EX: ttl }) : client.del(key(sid));

      void operation.then(
        () => callback?.(),
        (error: unknown) => callback?.(error),
      );
    },
    destroy(sid, callback) {
      void client.del(key(sid)).then(
        () => callback?.(),
        (error: unknown) => callback?.(error),
      );
    },
  };
}
