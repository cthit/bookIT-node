-- CreateTable
CREATE TABLE "data_migration" (
    "id" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_migration_pkey" PRIMARY KEY ("id")
);
