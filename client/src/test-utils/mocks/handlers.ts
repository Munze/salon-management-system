import { http, HttpResponse } from 'msw';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STAFF',
      },
    }, { status: 200 })
  }),

  // Appointments handlers
  http.get(`${API_URL}/appointments`, () => {
    return HttpResponse.json({
      appointments: [
        {
          id: '1',
          clientId: '1',
          serviceId: '1',
          startTime: '2024-03-01T10:00:00Z',
          endTime: '2024-03-01T11:00:00Z',
          status: 'CONFIRMED',
        },
      ],
    }, { status: 200 })
  }),

  // Clients handlers
  http.get(`${API_URL}/clients`, () => {
    return HttpResponse.json({
      clients: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      ],
    }, { status: 200 })
  }),

  // Services handlers
  http.get(`${API_URL}/services`, () => {
    return HttpResponse.json({
      services: [
        {
          id: '1',
          name: 'Haircut',
          duration: 60,
          price: 50,
        },
      ],
    }, { status: 200 })
  }),
];
