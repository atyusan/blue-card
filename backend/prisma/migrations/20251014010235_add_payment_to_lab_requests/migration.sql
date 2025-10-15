-- AlterTable
ALTER TABLE "lab_requests"
ADD COLUMN "claimedAt" TIMESTAMP(3),
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "serviceId" TEXT,
ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "totalPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN "requirePayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "invoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lab_requests_invoiceId_key" ON "lab_requests" ("invoiceId");

-- AddForeignKey
ALTER TABLE "lab_requests"
ADD CONSTRAINT "lab_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_requests"
ADD CONSTRAINT "lab_requests_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE;