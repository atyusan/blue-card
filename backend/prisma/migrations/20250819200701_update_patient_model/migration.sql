/*
  Warnings:

  - You are about to drop the column `bloodType` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `medicalHistory` on the `patients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."Genotype" AS ENUM ('AA', 'AS', 'AC', 'SS', 'SC', 'CC');

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'PATIENT';

-- AlterTable
ALTER TABLE "public"."patients" DROP COLUMN "bloodType",
DROP COLUMN "emergencyContact",
DROP COLUMN "emergencyPhone",
DROP COLUMN "medicalHistory",
ADD COLUMN     "bloodGroup" "public"."BloodType",
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelationship" TEXT,
ADD COLUMN     "genotype" "public"."Genotype",
ADD COLUMN     "height" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "public"."patients"("userId");

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
