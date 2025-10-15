-- AlterEnum
ALTER TYPE "LabTestStatus" ADD VALUE 'CLAIMED';

-- AlterTable
ALTER TABLE "lab_tests"
ADD COLUMN "resultValue" TEXT,
ADD COLUMN "resultUnit" TEXT,
ADD COLUMN "referenceRange" TEXT,
ADD COLUMN "isCritical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "labTechnicianId" TEXT,
ADD COLUMN "claimedAt" TIMESTAMP(3),
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "lab_tests"
ADD CONSTRAINT "lab_tests_labTechnicianId_fkey" FOREIGN KEY ("labTechnicianId") REFERENCES "staff_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE;