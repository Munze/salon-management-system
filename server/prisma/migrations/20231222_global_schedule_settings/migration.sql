-- Drop existing table if it exists
DROP TABLE IF EXISTS "ScheduleSettings" CASCADE;

-- Create global ScheduleSettings table
CREATE TABLE IF NOT EXISTS "ScheduleSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default working hours
INSERT INTO "ScheduleSettings" ("id", "dayOfWeek", "startTime", "endTime", "isWorkingDay")
VALUES 
    (gen_random_uuid(), 'MONDAY', '09:00', '17:00', true),
    (gen_random_uuid(), 'TUESDAY', '09:00', '17:00', true),
    (gen_random_uuid(), 'WEDNESDAY', '09:00', '17:00', true),
    (gen_random_uuid(), 'THURSDAY', '09:00', '17:00', true),
    (gen_random_uuid(), 'FRIDAY', '09:00', '17:00', true),
    (gen_random_uuid(), 'SATURDAY', '09:00', '15:00', true),
    (gen_random_uuid(), 'SUNDAY', '00:00', '00:00', false);
