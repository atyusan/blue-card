-- CreateEnum
CREATE TYPE "public"."PaystackInvoiceStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."paystack_customers" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "paystackCustomerId" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paystack_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."paystack_invoices" (
    "id" TEXT NOT NULL,
    "localInvoiceId" TEXT NOT NULL,
    "paystackCustomerId" TEXT NOT NULL,
    "paystackInvoiceId" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "offlineReference" TEXT,
    "status" "public"."PaystackInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "hasInvoice" BOOLEAN NOT NULL DEFAULT false,
    "invoiceNumber" TEXT,
    "pdfUrl" TEXT,
    "lineItems" JSONB,
    "tax" JSONB,
    "discount" JSONB,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paystack_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paystack_customers_patientId_key" ON "public"."paystack_customers"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_customers_paystackCustomerId_key" ON "public"."paystack_customers"("paystackCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_customers_customerCode_key" ON "public"."paystack_customers"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_invoices_localInvoiceId_key" ON "public"."paystack_invoices"("localInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_invoices_paystackInvoiceId_key" ON "public"."paystack_invoices"("paystackInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_invoices_requestCode_key" ON "public"."paystack_invoices"("requestCode");

-- AddForeignKey
ALTER TABLE "public"."paystack_customers" ADD CONSTRAINT "paystack_customers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."paystack_invoices" ADD CONSTRAINT "paystack_invoices_localInvoiceId_fkey" FOREIGN KEY ("localInvoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."paystack_invoices" ADD CONSTRAINT "paystack_invoices_paystackCustomerId_fkey" FOREIGN KEY ("paystackCustomerId") REFERENCES "public"."paystack_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
