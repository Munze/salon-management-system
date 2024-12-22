-- Add salonId column to ScheduleSettings
ALTER TABLE "ScheduleSettings" ADD COLUMN "salonId" TEXT NOT NULL DEFAULT 'default-salon';

-- Create unique constraint on salonId
ALTER TABLE "ScheduleSettings" ADD CONSTRAINT "ScheduleSettings_salonId_key" UNIQUE ("salonId");

-- Add foreign key constraint
ALTER TABLE "ScheduleSettings" ADD CONSTRAINT "ScheduleSettings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
