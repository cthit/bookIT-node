-- Bookings store Gamma IDs as UUIDs, and a cleared booker is NULL instead of ''.
--
-- Bookings from older versions hold super group names and cids. Converting
-- them needs Gamma, so data migration 0001-gamma-ids does all of this at
-- startup, in one transaction, so a failed upgrade leaves the database as the
-- previous version expects it. Databases without such bookings, such as new
-- ones, are converted here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "event"
    WHERE "booked_as" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR ("booked_by" <> ''
           AND "booked_by" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  ) THEN
    ALTER TABLE "event" ALTER COLUMN "booked_as" DROP NOT NULL,
                        ALTER COLUMN "booked_by" DROP NOT NULL;

    UPDATE "event" SET "booked_by" = NULL WHERE "booked_by" = '';

    ALTER TABLE "event" ALTER COLUMN "booked_as" SET DATA TYPE UUID USING "booked_as"::uuid,
                        ALTER COLUMN "booked_by" SET DATA TYPE UUID USING "booked_by"::uuid;
  END IF;
END $$;
