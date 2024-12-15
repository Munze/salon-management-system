import { addHours, addDays, startOfDay } from 'date-fns';

export const generateMockAppointment = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  clientId: '1',
  serviceId: '1',
  startTime: new Date().toISOString(),
  endTime: addHours(new Date(), 1).toISOString(),
  status: 'CONFIRMED',
  client: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  service: {
    id: '1',
    name: 'Haircut',
    duration: 60,
    price: 50,
  },
  ...overrides,
});

export const generateMockClient = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockService = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  name: 'Haircut',
  description: 'Standard haircut service',
  duration: 60,
  price: 50,
  ...overrides,
});

export const generateMockUser = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  email: 'staff@example.com',
  name: 'Staff Member',
  role: 'STAFF',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockSchedule = (startDate = new Date(), days = 7) => {
  const schedule = [];
  const start = startOfDay(startDate);

  for (let i = 0; i < days; i++) {
    const day = addDays(start, i);
    schedule.push({
      date: day.toISOString(),
      slots: [
        {
          start: addHours(day, 9).toISOString(),
          end: addHours(day, 17).toISOString(),
          available: true,
        },
      ],
    });
  }

  return schedule;
};
