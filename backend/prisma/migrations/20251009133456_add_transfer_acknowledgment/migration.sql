-- AlterTable
ALTER TABLE "public"."treatment_providers" ADD COLUMN     "transferAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transferAcknowledgedAt" TIMESTAMP(3);
