import { isAxiosError } from "axios";
import { authRequest } from "../utils";

export interface GammaSuperGroup {
  id: string;
  name: string;
  prettyName: string;
  type: string;
}

export interface GammaUser {
  id: string;
  cid: string;
  nick: string;
  firstName: string;
  lastName: string;
}

// Fresh for ten minutes. After that the stale value is still served while it
// is refreshed in the background, so pages wait on Gamma only for a first lookup.
const FRESH_MS = 10 * 60 * 1000;
// After a failed refresh, wait this long before asking Gamma again.
const RETRY_MS = 30 * 1000;

interface Entry<T> {
  cached: boolean;
  value?: T;
  error?: unknown;
  pending?: Promise<T>;
  expires: number;
}

/** Caches Gamma lookups in memory; concurrent lookups share one request. */
export function cached<T>(fetch: (key: string) => Promise<T>) {
  const entries = new Map<string, Entry<T>>();

  const refresh = (key: string, entry: Entry<T>): Promise<T> =>
    (entry.pending ??= fetch(key)
      .then(
        (value) => {
          Object.assign(entry, { cached: true, value, error: undefined });
          entry.expires = Date.now() + FRESH_MS;

          return value;
        },
        (error: unknown) => {
          entry.error = error;
          entry.expires = Date.now() + RETRY_MS;

          throw error;
        },
      )
      .finally(() => {
        entry.pending = undefined;
      }));

  return {
    async get(key: string): Promise<T> {
      let entry = entries.get(key);

      if (!entry) {
        entry = { cached: false, expires: 0 };
        entries.set(key, entry);
      }

      if (Date.now() >= entry.expires) {
        const pending = refresh(key, entry);

        if (!entry.cached) {
          return pending;
        }

        pending.catch((error: unknown) => {
          console.error("Gamma refresh failed", error instanceof Error ? error.message : error);
        });
      }

      if (entry.cached) {
        return entry.value as T;
      }

      throw entry.error;
    },
  };
}

const superGroups = cached(() => authRequest<GammaSuperGroup[]>("/api/client/v1/superGroups"));

const users = cached(async (id) => {
  try {
    return await authRequest<GammaUser>(`/api/client/v1/users/${encodeURIComponent(id)}`);
  } catch (error) {
    // Unknown users, and users who never accepted BookIT, are reported as 404.
    if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
      return null;
    }

    throw error;
  }
});

export const allSuperGroups = (): Promise<GammaSuperGroup[]> => superGroups.get("all");

export async function superGroup(id: string): Promise<GammaSuperGroup | null> {
  return (await allSuperGroups()).find((group) => group.id === id) ?? null;
}

export const user = (id: string): Promise<GammaUser | null> => users.get(id);

/** Users who currently accept BookIT in Gamma; not users who revoked it. */
export const acceptedUsers = (): Promise<GammaUser[]> =>
  authRequest<GammaUser[]>("/api/client/v1/users");

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
