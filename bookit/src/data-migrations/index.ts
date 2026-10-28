import type { Prisma, PrismaClient } from "@prisma/client";
import { gammaIds } from "./0001-gamma-ids";

/**
 * A one-off change to existing data that SQL migrations cannot express, such
 * as one that needs Gamma. Each runs once, recorded in the data_migration table.
 */
export interface DataMigration {
  /** Never rename an applied migration; it would run again. */
  id: string;
  run(tx: Prisma.TransactionClient): Promise<void>;
}

/** Applied in order. Append new migrations; never reorder or remove them. */
const migrations: DataMigration[] = [gammaIds];

// Serializes migrations across app instances starting at the same time.
const LOCK_KEY = 0x626f6f6b; // "book"

/**
 * Applies pending data migrations before the server starts. Each migration and
 * its record commit together, so a failure leaves it pending for the next start.
 */
export async function runDataMigrations(prisma: PrismaClient): Promise<void> {
  for (const migration of migrations) {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;

        if (await tx.data_migration.findUnique({ where: { id: migration.id } })) {
          return;
        }

        console.log(`Applying data migration ${migration.id}`);
        await migration.run(tx);
        await tx.data_migration.create({ data: { id: migration.id } });
      },
      // Migrations may call Gamma and touch every booking.
      { maxWait: 60_000, timeout: 10 * 60_000 },
    );
  }
}
