import type { PrismaClient } from "@prisma/client";

export async function cleanupPersonalData(prisma: PrismaClient): Promise<void> {
  // Keep the existing database-local midnight cutoff, including its boundary.
  const count = await prisma.$executeRaw`
    UPDATE event
    SET phone = '', booked_by = ''
    WHERE event.end <= NOW()::DATE - 14
      AND (phone <> '' OR booked_by <> '')
  `;

  console.log(`BookIT privacy cleanup cleared contact data from ${count} bookings`);
}

export function startCleanup(prisma: PrismaClient): () => Promise<void> {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  async function run() {
    let delay = 24 * 60 * 60 * 1000;

    try {
      await cleanupPersonalData(prisma);
    } catch (error) {
      console.error("BookIT privacy cleanup failed; retrying in one hour", error);
      delay = 60 * 60 * 1000;
    }

    // Schedule after completion so a slow query cannot overlap the next run.
    if (!stopped) {
      timer = setTimeout(() => {
        running = run();
      }, delay);
      timer.unref();
    }
  }

  let running = run();

  return async () => {
    stopped = true;
    clearTimeout(timer);
    await running;
  };
}
