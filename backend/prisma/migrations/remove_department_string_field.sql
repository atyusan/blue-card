-- First, update any existing records that might have the department field
-- Since we're using departmentId now, we can safely remove the department string field

-- Drop the department column from staff_members table
ALTER TABLE "staff_members" DROP COLUMN IF EXISTS "department";