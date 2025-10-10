-- CreateEnum
CREATE TYPE "public"."TreatmentType" AS ENUM ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'THERAPY', 'REHABILITATION', 'PREVENTIVE', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "public"."TreatmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TreatmentPriority" AS ENUM ('EMERGENCY', 'URGENT', 'ROUTINE', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."EmergencyLevel" AS ENUM ('CRITICAL', 'HIGH', 'MODERATE', 'LOW');

-- CreateEnum
CREATE TYPE "public"."ProviderRole" AS ENUM ('PRIMARY', 'CONSULTANT', 'SPECIALIST', 'ASSISTANT', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "public"."DiagnosisStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT');

-- CreateEnum
CREATE TYPE "public"."LabRequestStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LabUrgency" AS ENUM ('STAT', 'URGENT', 'ROUTINE');

-- CreateEnum
CREATE TYPE "public"."LabResultStatus" AS ENUM ('PENDING', 'COMPLETED', 'CRITICAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ImagingRequestStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ImagingType" AS ENUM ('XRAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 'MAMMOGRAM', 'PET_SCAN', 'NUCLEAR_MEDICINE', 'FLUOROSCOPY');

-- CreateEnum
CREATE TYPE "public"."ImagingUrgency" AS ENUM ('STAT', 'URGENT', 'ROUTINE');

-- CreateEnum
CREATE TYPE "public"."ImagingResultStatus" AS ENUM ('PENDING', 'COMPLETED', 'CRITICAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProcedureStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."AdmissionType" AS ENUM ('EMERGENCY', 'ELECTIVE', 'TRANSFER', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "public"."ReferralType" AS ENUM ('SPECIALIST', 'SECOND_OPINION', 'DIAGNOSTIC', 'THERAPY', 'SURGERY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."ReferralUrgency" AS ENUM ('EMERGENCY', 'URGENT', 'ROUTINE');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NoteType" AS ENUM ('PROGRESS', 'ASSESSMENT', 'PLAN', 'EDUCATION', 'COMMUNICATION', 'INCIDENT');

-- CreateEnum
CREATE TYPE "public"."TreatmentLinkType" AS ENUM ('FOLLOW_UP', 'ESCALATION', 'REFERRAL', 'CONTINUATION', 'PREPROCEDURE', 'POSTPROCEDURE', 'SERIES', 'PARALLEL', 'REPLACEMENT', 'CANCELLATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."WardType" ADD VALUE 'EMERGENCY';
ALTER TYPE "public"."WardType" ADD VALUE 'SURGICAL';
ALTER TYPE "public"."WardType" ADD VALUE 'MEDICAL';
ALTER TYPE "public"."WardType" ADD VALUE 'PSYCHIATRIC';
ALTER TYPE "public"."WardType" ADD VALUE 'REHABILITATION';

-- AlterTable
ALTER TABLE "public"."prescriptions" ADD COLUMN     "treatmentId" TEXT;

-- CreateTable
CREATE TABLE "public"."treatments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "primaryProviderId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "treatmentType" "public"."TreatmentType" NOT NULL,
    "status" "public"."TreatmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "public"."TreatmentPriority" NOT NULL DEFAULT 'ROUTINE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "pastMedicalHistory" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "emergencyLevel" "public"."EmergencyLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_providers" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "role" "public"."ProviderRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "treatment_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."diagnoses" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "diagnosisCode" TEXT,
    "diagnosisName" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."DiagnosisStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_requests" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "requestingProviderId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "description" TEXT,
    "urgency" "public"."LabUrgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "public"."LabRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "labProviderId" TEXT,
    "specimenType" TEXT,
    "collectionInstructions" TEXT,

    CONSTRAINT "lab_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_results" (
    "id" TEXT NOT NULL,
    "labRequestId" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "resultValue" TEXT,
    "normalRange" TEXT,
    "unit" TEXT,
    "status" "public"."LabResultStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."imaging_requests" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "requestingProviderId" TEXT NOT NULL,
    "imagingType" "public"."ImagingType" NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "description" TEXT,
    "urgency" "public"."ImagingUrgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "public"."ImagingRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "imagingProviderId" TEXT,
    "contrastRequired" BOOLEAN NOT NULL DEFAULT false,
    "preparationInstructions" TEXT,

    CONSTRAINT "imaging_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."imaging_results" (
    "id" TEXT NOT NULL,
    "imagingRequestId" TEXT NOT NULL,
    "finding" TEXT,
    "impression" TEXT,
    "recommendation" TEXT,
    "status" "public"."ImagingResultStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "imageUrls" TEXT[],

    CONSTRAINT "imaging_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."procedures" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "procedureCode" TEXT,
    "description" TEXT,
    "status" "public"."ProcedureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "anesthesia" TEXT,
    "complications" TEXT,
    "notes" TEXT,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "fromProviderId" TEXT NOT NULL,
    "toProviderId" TEXT,
    "toDepartmentId" TEXT,
    "referralType" "public"."ReferralType" NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" "public"."ReferralUrgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_notes" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "noteType" "public"."NoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_links" (
    "id" TEXT NOT NULL,
    "fromTreatmentId" TEXT NOT NULL,
    "toTreatmentId" TEXT NOT NULL,
    "linkType" "public"."TreatmentLinkType" NOT NULL,
    "linkReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "treatment_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "treatment_providers_treatmentId_providerId_key" ON "public"."treatment_providers"("treatmentId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_links_fromTreatmentId_toTreatmentId_linkType_key" ON "public"."treatment_links"("fromTreatmentId", "toTreatmentId", "linkType");

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatments" ADD CONSTRAINT "treatments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatments" ADD CONSTRAINT "treatments_primaryProviderId_fkey" FOREIGN KEY ("primaryProviderId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatments" ADD CONSTRAINT "treatments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatments" ADD CONSTRAINT "treatments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatments" ADD CONSTRAINT "treatments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_providers" ADD CONSTRAINT "treatment_providers_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_providers" ADD CONSTRAINT "treatment_providers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."diagnoses" ADD CONSTRAINT "diagnoses_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."diagnoses" ADD CONSTRAINT "diagnoses_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_requests" ADD CONSTRAINT "lab_requests_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_requests" ADD CONSTRAINT "lab_requests_requestingProviderId_fkey" FOREIGN KEY ("requestingProviderId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_requests" ADD CONSTRAINT "lab_requests_labProviderId_fkey" FOREIGN KEY ("labProviderId") REFERENCES "public"."staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_results" ADD CONSTRAINT "lab_results_labRequestId_fkey" FOREIGN KEY ("labRequestId") REFERENCES "public"."lab_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_results" ADD CONSTRAINT "lab_results_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imaging_requests" ADD CONSTRAINT "imaging_requests_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imaging_requests" ADD CONSTRAINT "imaging_requests_requestingProviderId_fkey" FOREIGN KEY ("requestingProviderId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imaging_requests" ADD CONSTRAINT "imaging_requests_imagingProviderId_fkey" FOREIGN KEY ("imagingProviderId") REFERENCES "public"."staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imaging_results" ADD CONSTRAINT "imaging_results_imagingRequestId_fkey" FOREIGN KEY ("imagingRequestId") REFERENCES "public"."imaging_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imaging_results" ADD CONSTRAINT "imaging_results_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."procedures" ADD CONSTRAINT "procedures_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."procedures" ADD CONSTRAINT "procedures_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_fromProviderId_fkey" FOREIGN KEY ("fromProviderId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_toProviderId_fkey" FOREIGN KEY ("toProviderId") REFERENCES "public"."staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_notes" ADD CONSTRAINT "treatment_notes_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_notes" ADD CONSTRAINT "treatment_notes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_links" ADD CONSTRAINT "treatment_links_fromTreatmentId_fkey" FOREIGN KEY ("fromTreatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_links" ADD CONSTRAINT "treatment_links_toTreatmentId_fkey" FOREIGN KEY ("toTreatmentId") REFERENCES "public"."treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_links" ADD CONSTRAINT "treatment_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
