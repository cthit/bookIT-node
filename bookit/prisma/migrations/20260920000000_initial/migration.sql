-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "room" AS ENUM ('BIG_HUB', 'GROUP_ROOM', 'CTC', 'THE_CLOUD');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "room" TEXT[],
    "booked_by" TEXT NOT NULL,
    "booked_as" TEXT NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule" (
    "id" UUID NOT NULL,
    "day_mask" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "allow" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "title" TEXT NOT NULL,
    "room" "room"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT '2022-02-25 18:58:00.815359'::timestamp without time zone,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT '2022-02-25 18:58:00.815359'::timestamp without time zone,

    CONSTRAINT "rule_pkey" PRIMARY KEY ("id")
);
