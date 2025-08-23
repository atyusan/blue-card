-- CreateEnum
CREATE TYPE "public"."RoomBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."surgeries" ADD COLUMN     "admissionId" TEXT,
ADD COLUMN     "anesthesiaFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "anesthesiaType" TEXT,
ADD COLUMN     "anesthesiologistId" TEXT,
ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pacuCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "requiresInpatient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roomBookingEnd" TIMESTAMP(3),
ADD COLUMN     "roomBookingStart" TIMESTAMP(3),
ADD COLUMN     "roomBookingStatus" "public"."RoomBookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "surgeryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "wardId" TEXT;

-- CreateTable
CREATE TABLE "public"."surgical_procedures" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgical_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operating_room_bookings" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "public"."RoomBookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_room_bookings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."surgeries" ADD CONSTRAINT "surgeries_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surgeries" ADD CONSTRAINT "surgeries_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "public"."wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surgeries" ADD CONSTRAINT "surgeries_anesthesiologistId_fkey" FOREIGN KEY ("anesthesiologistId") REFERENCES "public"."staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surgical_procedures" ADD CONSTRAINT "surgical_procedures_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "public"."surgeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."operating_room_bookings" ADD CONSTRAINT "operating_room_bookings_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "public"."surgeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
