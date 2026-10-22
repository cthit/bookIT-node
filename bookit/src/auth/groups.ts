import { isAxiosError } from "axios";
import { authRequest } from "../utils";

export interface GammaUserGroup {
  superGroup?: { type: string; name: string };
}

export interface GammaAuthority {
  superGroups: { name: string }[];
}

// Gamma assigns this client authority to the super groups that may book rooms.
export const bookingAuthority = (): string => process.env.BOOKING_AUTHORITY || "booking";

/**
 * Super groups the user may book as: active (non-alumni) memberships that are
 * also assigned the booking authority in Gamma.
 */
export function bookableGroups(
  userGroups: GammaUserGroup[],
  authoritySuperGroups: { name: string }[],
): string[] {
  const authorized = new Set(authoritySuperGroups.map(({ name }) => name));

  return [
    ...new Set(
      userGroups.flatMap(({ superGroup }) =>
        superGroup && superGroup.type.toLowerCase() !== "alumni" && authorized.has(superGroup.name)
          ? [superGroup.name]
          : [],
      ),
    ),
  ];
}

/**
 * Fetches the super groups assigned the booking authority. A missing authority
 * means no group may book, so it is logged and treated as empty; any other
 * failure propagates and fails the login.
 */
export async function bookingAuthoritySuperGroups(): Promise<GammaAuthority["superGroups"]> {
  const authority = bookingAuthority();

  try {
    const { superGroups } = await authRequest<GammaAuthority>(
      `/api/client/v1/authorities/${encodeURIComponent(authority)}`,
    );

    return superGroups;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      console.warn(
        `Gamma client ${process.env.CLIENT_ID} has no "${authority}" authority; no group can book rooms`,
      );

      return [];
    }

    throw error;
  }
}
