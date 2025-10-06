/*
  Warnings:

  - You are about to drop the column `breakEnd` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `breakStart` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `bufferTime` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `maxAppointments` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `slotDuration` on the `provider_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `staff_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."provider_schedules" DROP COLUMN "breakEnd",
DROP COLUMN "breakStart",
DROP COLUMN "bufferTime",
DROP COLUMN "isAvailable",
DROP COLUMN "maxAppointments",
DROP COLUMN "slotDuration",
ADD COLUMN     "breakEndTime" TEXT,
ADD COLUMN     "breakStartTime" TEXT,
ADD COLUMN     "isWorking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxAppointmentsPerHour" INTEGER NOT NULL DEFAULT 2,
ALTER COLUMN "dayOfWeek" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."staff_members" DROP COLUMN "department";
