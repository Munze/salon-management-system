import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Default working hours for each day
  const defaultWorkingHours = [
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
    { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
    { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
    { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '15:00', isWorkingDay: true },
    { dayOfWeek: 'SUNDAY', startTime: '00:00', endTime: '00:00', isWorkingDay: false },
  ];

  // Create working hours for each day
  for (const hours of defaultWorkingHours) {
    await prisma.scheduleSettings.create({
      data: hours
    });
  }

  console.log('Default working hours added');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
