/*
Warnings:

- You are about to drop the column `department` on the `cash_requests` table. All the data in the column will be lost.
- You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
- Added the required column `departmentId` to the `cash_requests` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_role_assignments" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "staff_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "public"."departments" ("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles" ("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_role_assignments_staffMemberId_roleId_key" ON "public"."staff_role_assignments" ("staffMemberId", "roleId");

-- Insert default departments based on existing data
INSERT INTO
    "public"."departments" (
        "id",
        "name",
        "code",
        "description",
        "isActive",
        "createdAt",
        "updatedAt"
    )
VALUES (
        'dept_admin',
        'Administration',
        'ADMIN',
        'Hospital administration and management',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_card',
        'Cardiology',
        'CARD',
        'Cardiology department',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_ortho',
        'Orthopedics',
        'ORTHO',
        'Orthopedics and surgery',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_er',
        'Emergency',
        'ER',
        'Emergency department',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_fin',
        'Finance',
        'FIN',
        'Finance and accounting',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_pharm',
        'Pharmacy',
        'PHARM',
        'Pharmacy services',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_lab',
        'Laboratory',
        'LAB',
        'Medical laboratory',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dept_gen',
        'General Medicine',
        'GEN',
        'General medicine and consultations',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

-- Insert default roles based on existing UserRole enum
INSERT INTO
    "public"."roles" (
        "id",
        "name",
        "code",
        "description",
        "permissions",
        "isActive",
        "createdAt",
        "updatedAt"
    )
VALUES (
        'role_admin',
        'System Administrator',
        'ADMIN',
        'System administrator with full access',
        '["*"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_doctor',
        'Doctor',
        'DOCTOR',
        'Medical doctor role',
        '["view_patients", "edit_patients", "view_appointments", "edit_appointments", "view_billing"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_nurse',
        'Nurse',
        'NURSE',
        'Nursing staff role',
        '["view_patients", "view_appointments", "view_billing"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_lab_tech',
        'Lab Technician',
        'LAB_TECHNICIAN',
        'Laboratory technician role',
        '["view_patients", "manage_lab_tests", "view_lab_orders"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_pharmacist',
        'Pharmacist',
        'PHARMACIST',
        'Pharmacy staff role',
        '["view_patients", "manage_medications", "view_prescriptions"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_cashier',
        'Cashier',
        'CASHIER',
        'Cashier role',
        '["view_patients", "view_billing", "view_payments", "edit_payments"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_receptionist',
        'Receptionist',
        'RECEPTIONIST',
        'Reception staff role',
        '["view_patients", "edit_patients", "view_appointments", "edit_appointments", "view_billing", "edit_billing"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'role_accountant',
        'Accountant',
        'ACCOUNTANT',
        'Accounting staff role',
        '["view_patients", "view_billing", "edit_billing", "view_payments", "edit_payments"]',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

-- Add departmentId columns to existing tables
ALTER TABLE "public"."staff_members" ADD COLUMN "departmentId" TEXT;

ALTER TABLE "public"."services" ADD COLUMN "departmentId" TEXT;

ALTER TABLE "public"."cash_requests" ADD COLUMN "departmentId" TEXT;

-- Update staff_members with department references
UPDATE "public"."staff_members"
SET
    "departmentId" = CASE
        WHEN "department" = 'Administration' THEN 'dept_admin'
        WHEN "department" = 'Cardiology' THEN 'dept_card'
        WHEN "department" = 'Orthopedics' THEN 'dept_ortho'
        WHEN "department" = 'Emergency' THEN 'dept_er'
        WHEN "department" = 'Finance' THEN 'dept_fin'
        WHEN "department" = 'Pharmacy' THEN 'dept_pharm'
        WHEN "department" = 'Laboratory' THEN 'dept_lab'
        WHEN "department" = 'General Medicine' THEN 'dept_gen'
        ELSE 'dept_gen'
    END;

-- Create role assignments for existing staff members based on their user roles
INSERT INTO
    "public"."staff_role_assignments" (
        "id",
        "staffMemberId",
        "roleId",
        "assignedAt",
        "isActive",
        "createdAt",
        "updatedAt"
    )
SELECT
    gen_random_uuid ()::text,
    sm.id,
    CASE
        WHEN u.role = 'ADMIN' THEN 'role_admin'
        WHEN u.role = 'DOCTOR' THEN 'role_doctor'
        WHEN u.role = 'NURSE' THEN 'role_nurse'
        WHEN u.role = 'LAB_TECHNICIAN' THEN 'role_lab_tech'
        WHEN u.role = 'PHARMACIST' THEN 'role_pharmacist'
        WHEN u.role = 'CASHIER' THEN 'role_cashier'
        WHEN u.role = 'RECEPTIONIST' THEN 'role_receptionist'
        WHEN u.role = 'ACCOUNTANT' THEN 'role_accountant'
        ELSE 'role_receptionist'
    END,
    sm."createdAt",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."staff_members" sm
    JOIN "public"."users" u ON sm."userId" = u.id;

-- Update cash_requests with department references
UPDATE "public"."cash_requests"
SET
    "departmentId" = CASE
        WHEN "department" = 'Administration' THEN 'dept_admin'
        WHEN "department" = 'Cardiology' THEN 'dept_card'
        WHEN "department" = 'Orthopedics' THEN 'dept_ortho'
        WHEN "department" = 'Emergency' THEN 'dept_er'
        WHEN "department" = 'Finance' THEN 'dept_fin'
        WHEN "department" = 'Pharmacy' THEN 'dept_pharm'
        WHEN "department" = 'Laboratory' THEN 'dept_lab'
        WHEN "department" = 'General Medicine' THEN 'dept_gen'
        ELSE 'dept_gen'
    END;

-- Now make departmentId NOT NULL and add foreign key constraints
ALTER TABLE "public"."staff_members"
ALTER COLUMN "departmentId"
SET NOT NULL;

ALTER TABLE "public"."cash_requests"
ALTER COLUMN "departmentId"
SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "public"."staff_members"
ADD CONSTRAINT "staff_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."services"
ADD CONSTRAINT "services_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."cash_requests"
ADD CONSTRAINT "cash_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints for staff_role_assignments
ALTER TABLE "public"."staff_role_assignments"
ADD CONSTRAINT "staff_role_assignments_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "public"."staff_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."staff_role_assignments"
ADD CONSTRAINT "staff_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."staff_role_assignments"
ADD CONSTRAINT "staff_role_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."staff_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Now drop the old columns and enum
ALTER TABLE "public"."cash_requests" DROP COLUMN "department";

ALTER TABLE "public"."users" DROP COLUMN "role";

DROP TYPE "public"."UserRole";