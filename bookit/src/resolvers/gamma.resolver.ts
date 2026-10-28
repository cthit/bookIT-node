import type { GammaUser as GammaUserResult, SuperGroup } from "../generated/schema";
import {
  allSuperGroups,
  superGroup,
  user as gammaUser,
  type GammaSuperGroup,
  type GammaUser,
} from "../gamma/directory";

const superGroupResult = ({ id, name, prettyName }: GammaSuperGroup): SuperGroup => ({
  id,
  name,
  pretty_name: prettyName,
});

const userResult = (user: GammaUser): GammaUserResult => ({
  id: user.id,
  nick: user.nick,
  first_name: user.firstName,
  last_name: user.lastName,
  display_name: displayName(user),
});

export const displayName = ({ firstName, nick, lastName }: GammaUser): string =>
  [firstName, nick.trim() && `"${nick}"`, lastName].filter((part) => part.trim()).join(" ");

// Names are cosmetic; a Gamma outage must not break the page showing them.
async function orNull<T>(lookup: () => Promise<T | null>): Promise<T | null> {
  try {
    return await lookup();
  } catch (error) {
    console.error("Gamma lookup failed", error instanceof Error ? error.message : error);

    return null;
  }
}

export const bookedAsGroup = (id: string) =>
  orNull(async () => {
    const group = await superGroup(id);

    return group ? superGroupResult(group) : null;
  });

export const bookedByUser = (id: string) =>
  orNull(async () => {
    const user = await gammaUser(id);

    return user ? userResult(user) : null;
  });

/** The given super groups, falling back to their IDs as names if Gamma is unreachable. */
export async function superGroups(ids: string[]): Promise<SuperGroup[]> {
  const groups = await orNull(allSuperGroups);

  return ids.map((id) => {
    const group = groups?.find((group) => group.id === id);

    return group ? superGroupResult(group) : { id, name: id, pretty_name: id };
  });
}
