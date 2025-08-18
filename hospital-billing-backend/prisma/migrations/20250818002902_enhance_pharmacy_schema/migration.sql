/*
  Warnings:

  - You are about to drop the column `serviceId` on the `prescription_medications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[drugCode]` on the table `medications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `drugCode` to the `medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicationId` to the `prescription_medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `prescription_medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `prescription_medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `prescription_medications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."prescription_medications" DROP CONSTRAINT "prescription_medications_serviceId_fkey";

-- AlterTable
ALTER TABLE "public"."medications" ADD COLUMN     "category" TEXT,
ADD COLUMN     "controlledDrug" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "drugCode" TEXT NOT NULL,
ADD COLUMN     "requiresPrescription" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."prescription_medications" DROP COLUMN "serviceId",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicationId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."prescriptions" ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."medication_inventory" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(10,4) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dispensed_medications" (
    "id" TEXT NOT NULL,
    "prescriptionMedicationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensedBy" TEXT NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispensed_medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medication_inventory_batchNumber_key" ON "public"."medication_inventory"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "medications_drugCode_key" ON "public"."medications"("drugCode");

-- AddForeignKey
ALTER TABLE "public"."prescription_medications" ADD CONSTRAINT "prescription_medications_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_inventory" ADD CONSTRAINT "medication_inventory_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispensed_medications" ADD CONSTRAINT "dispensed_medications_prescriptionMedicationId_fkey" FOREIGN KEY ("prescriptionMedicationId") REFERENCES "public"."prescription_medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispensed_medications" ADD CONSTRAINT "dispensed_medications_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."medication_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
