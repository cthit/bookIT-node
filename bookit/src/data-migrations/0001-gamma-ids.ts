import {
  acceptedUsers,
  allSuperGroups,
  isUuid,
  type GammaSuperGroup,
  type GammaUser,
} from "../gamma/directory";
import type { DataMigration } from ".";

interface Ownership {
  id: string;
  booked_as: string | null;
  booked_by: string | null;
}

export interface GammaIdsPlan {
  updates: Ownership[];
  unresolved: { id: string; field: "booked_as" | "booked_by" }[];
}

const isId = (value: string | null) => value === null || isUuid(value);

const needsIds = ({ booked_as, booked_by }: Ownership) => !isId(booked_as) || !isId(booked_by);

/**
 * Maps the super group names and cids older bookings were stored with to Gamma
 * IDs. Values without an ID become null: booked_as holding a cid (old private
 * bookings, which can no longer be made), groups Gamma no longer has, and
 * bookers who do not currently accept BookIT in Gamma. A booking without a
 * booker is handled like one whose personal data was cleared.
 */
export function planGammaIds(
  bookings: Ownership[],
  superGroups: GammaSuperGroup[],
  users: GammaUser[],
): GammaIdsPlan {
  const groupIds = new Map(superGroups.map(({ name, id }) => [name, id]));
  const userIds = new Map(users.map(({ cid, id }) => [cid, id]));
  const plan: GammaIdsPlan = { updates: [], unresolved: [] };

  for (const booking of bookings.filter(needsIds)) {
    const resolve = (field: "booked_as" | "booked_by", ids: Map<string, string>) => {
      const value = booking[field];

      if (value === null || isUuid(value)) {
        return value;
      }

      const id = ids.get(value) ?? null;

      if (!id) {
        plan.unresolved.push({ id: booking.id, field });
      }

      return id;
    };

    plan.updates.push({
      id: booking.id,
      booked_as: resolve("booked_as", groupIds),
      booked_by: resolve("booked_by", userIds),
    });
  }

  return plan;
}

/**
 * Bookings used to store the super group name and the booker's cid, with ''
 * for a cleared booker. Converts them to Gamma IDs and null, then makes both
 * columns nullable UUIDs; the SQL migration 20261028000001_gamma_id_columns
 * already did so if no such bookings existed.
 *
 * Uses raw SQL, since the Prisma client describes the columns as UUIDs.
 */
export const gammaIds: DataMigration = {
  id: "0001-gamma-ids",
  async run(tx) {
    const [{ data_type }] = await tx.$queryRaw<{ data_type: string }[]>`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'event' AND column_name = 'booked_as'
    `;

    if (data_type === "uuid") {
      return;
    }

    await tx.$executeRaw`
      ALTER TABLE event ALTER COLUMN booked_as DROP NOT NULL, ALTER COLUMN booked_by DROP NOT NULL
    `;
    await tx.$executeRaw`UPDATE event SET booked_by = NULL WHERE booked_by = ''`;

    const bookings = (
      await tx.$queryRaw<Ownership[]>`SELECT id::text, booked_as, booked_by FROM event`
    ).filter(needsIds);

    if (bookings.length > 0) {
      const [superGroups, users] = await Promise.all([allSuperGroups(), acceptedUsers()]);

      // The conversion cannot be undone. Empty lists mean BookIT is talking to
      // the wrong or an empty Gamma (check ISSUER_BASE_URL); fail startup
      // rather than clear the ownership of every booking.
      const needsGroups = bookings.some(({ booked_as }) => !isId(booked_as));
      const needsUsers = bookings.some(({ booked_by }) => !isId(booked_by));

      if ((needsGroups && superGroups.length === 0) || (needsUsers && users.length === 0)) {
        throw new Error(
          `Gamma at ${process.env.ISSUER_BASE_URL} returned no super groups or users; refusing to convert bookings`,
        );
      }

      const { updates, unresolved } = planGammaIds(bookings, superGroups, users);

      // Leave updated_at alone: this changes how ownership is stored, not the booking.
      for (const { id, booked_as, booked_by } of updates) {
        await tx.$executeRaw`
          UPDATE event SET booked_as = ${booked_as}, booked_by = ${booked_by} WHERE id = ${id}::uuid
        `;
      }

      console.log(
        `Converted ${updates.length} bookings to Gamma IDs; ${unresolved.length} values had no ID and were set to null`,
      );

      // Booking IDs only: the unresolved values may be cids, which are personal data.
      for (const { id, field } of unresolved) {
        console.warn(`No Gamma ID for booking ${id} ${field}; set to null`);
      }
    }

    await tx.$executeRaw`
      ALTER TABLE event
        ALTER COLUMN booked_as SET DATA TYPE UUID USING booked_as::uuid,
        ALTER COLUMN booked_by SET DATA TYPE UUID USING booked_by::uuid
    `;
  },
};
