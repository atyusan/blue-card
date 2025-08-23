-- AlterTable
ALTER TABLE "public"."patients" ADD COLUMN     "insuranceGroupNumber" TEXT,
ADD COLUMN     "insurancePolicyNumber" TEXT,
ADD COLUMN     "insuranceProvider" TEXT;
