# Salon Management System

A comprehensive web application for managing salon schedules, appointments, and client information.

## Features

- 🔐 Secure Staff Login System
- 📅 Schedule Management
- 👥 Client Management
- 📝 Appointment Booking and Management
- 📧 Automated Notifications
- 📊 Real-time Availability Display

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- JWT for authentication
- PostgreSQL database
- Prisma as ORM
- SendGrid for email notifications

### Development Tools
- ESLint & Prettier for code formatting
- Jest for testing
- Docker for containerization

## Project Structure

```
salon-management-system/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Redux store
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── package.json
│
├── docker-compose.yml     # Docker compose configuration
└── README.md             # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- npm or yarn
- Docker (optional)

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```
3. Set up environment variables:
   - Create `.env` files in both client and server directories
   - Add necessary environment variables (see `.env.example` files)

4. Start development servers:
   ```bash
   # Start frontend development server
   cd client
   npm run dev

   # Start backend development server
   cd ../server
   npm run dev
   ```

## API Documentation

Detailed API documentation will be available at `/api/docs` when running the server.

## Deployment

The application can be deployed on various platforms:
- Frontend: Vercel, Netlify
- Backend: Render, Railway
- Database: Supabase, Railway

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
