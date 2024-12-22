/*
  Warnings:

  - You are about to drop the column `therapistId` on the `ScheduleSettings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScheduleSettings" DROP CONSTRAINT "ScheduleSettings_therapistId_fkey";

-- AlterTable
ALTER TABLE "ScheduleSettings" DROP COLUMN "therapistId";
