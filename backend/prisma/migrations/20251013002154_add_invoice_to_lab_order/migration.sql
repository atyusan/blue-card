-- AlterTable
ALTER TABLE "lab_orders" ADD COLUMN "invoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_invoiceId_key" ON "lab_orders" ("invoiceId");

-- AddForeignKey
ALTER TABLE "lab_orders"
ADD CONSTRAINT "lab_orders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE;