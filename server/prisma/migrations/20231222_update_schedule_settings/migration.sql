-- Create ScheduleSettings table
CREATE TABLE IF NOT EXISTS "ScheduleSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "therapistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleSettings_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
