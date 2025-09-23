/*
  Warnings:

  - A unique constraint covering the columns `[staffMemberId,roleId,scope,scopeId]` on the table `staff_role_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."staff_role_assignments_staffMemberId_roleId_key";

-- AlterTable
ALTER TABLE "public"."staff_role_assignments" ADD COLUMN     "conditions" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "scopeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "staff_role_assignments_staffMemberId_roleId_scope_scopeId_key" ON "public"."staff_role_assignments"("staffMemberId", "roleId", "scope", "scopeId");
