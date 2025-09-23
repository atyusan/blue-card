-- CreateEnum
CREATE TYPE "public"."PermissionRequestUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."PermissionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PermissionApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ABSTAINED');

-- CreateEnum
CREATE TYPE "public"."PermissionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."PermissionAuditLevel" AS ENUM ('BASIC', 'STANDARD', 'DETAILED', 'COMPREHENSIVE');

-- CreateTable
CREATE TABLE "public"."permission_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" "public"."PermissionRequestUrgency" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."PermissionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "attachments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_approvers" (
    "id" TEXT NOT NULL,
    "permissionRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "public"."PermissionApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_security" (
    "permission" TEXT NOT NULL,
    "riskLevel" "public"."PermissionRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "requiresMFA" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "maxDuration" INTEGER,
    "allowedIPs" JSONB,
    "allowedDevices" JSONB,
    "allowedTimeWindows" JSONB,
    "auditLevel" "public"."PermissionAuditLevel" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_security_pkey" PRIMARY KEY ("permission")
);

-- CreateTable
CREATE TABLE "public"."permission_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "deviceId" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_approvers_permissionRequestId_userId_key" ON "public"."permission_approvers"("permissionRequestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "permission_workflows_name_key" ON "public"."permission_workflows"("name");

-- AddForeignKey
ALTER TABLE "public"."permission_requests" ADD CONSTRAINT "permission_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_approvers" ADD CONSTRAINT "permission_approvers_permissionRequestId_fkey" FOREIGN KEY ("permissionRequestId") REFERENCES "public"."permission_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_approvers" ADD CONSTRAINT "permission_approvers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_audits" ADD CONSTRAINT "permission_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
