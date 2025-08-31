/*
  Warnings:

  - A unique constraint covering the columns `[slotId]` on the table `recurring_slot_patterns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appointmentId]` on the table `waitlist_entries` will be added. If there are existing duplicate values, this will fail.
  - Made the column `capacity` on table `resources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `appointmentId` on table `waitlist_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."appointment_notifications" DROP CONSTRAINT "appointment_notifications_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."recurring_slot_patterns" DROP CONSTRAINT "recurring_slot_patterns_slotId_fkey";

-- DropForeignKey
ALTER TABLE "public"."waitlist_entries" DROP CONSTRAINT "waitlist_entries_appointmentId_fkey";

-- AlterTable
ALTER TABLE "public"."appointment_bundles" ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "finalAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."appointments" ADD COLUMN     "cancellationReason" TEXT,
ALTER COLUMN "totalAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."provider_schedules" ALTER COLUMN "maxAppointments" SET DEFAULT 20,
ALTER COLUMN "bufferTime" SET DEFAULT 5;

-- AlterTable
ALTER TABLE "public"."resources" ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "capacity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."waitlist_entries" ALTER COLUMN "appointmentId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recurring_slot_patterns_slotId_key" ON "public"."recurring_slot_patterns"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_appointmentId_key" ON "public"."waitlist_entries"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."recurring_slot_patterns" ADD CONSTRAINT "recurring_slot_patterns_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."appointment_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waitlist_entries" ADD CONSTRAINT "waitlist_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_notifications" ADD CONSTRAINT "appointment_notifications_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
