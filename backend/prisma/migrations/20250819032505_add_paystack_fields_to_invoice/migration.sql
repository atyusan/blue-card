-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'PAYSTACK_TERMINAL';

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "paystackInvoiceId" TEXT,
ADD COLUMN     "paystackReference" TEXT;
