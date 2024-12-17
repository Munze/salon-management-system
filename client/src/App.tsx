import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Therapists from './pages/Therapists';
import Services from './pages/Services';
import Analytics from './pages/Analytics';
import AnalyticsByService from './pages/AnalyticsByService';
import AnalyticsByTherapist from './pages/AnalyticsByTherapist';
import Login from './pages/Login';
import Register from './pages/Register';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import ScheduleSettings from './pages/ScheduleSettings';
import UserManagement from './pages/UserManagement';
import Account from './pages/Account';
import theme from './theme';
import PrivateRoute from './components/auth/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ServiceAnalytics from './pages/ServiceAnalytics';
import TherapistAnalytics from './pages/TherapistAnalytics';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request-reset" element={<RequestPasswordReset />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="clients" element={<Clients />} />
          <Route path="therapists" element={<Therapists />} />
          <Route path="services" element={<Services />} />
          <Route path="analytics">
            <Route index element={<Analytics />} />
            <Route path="services" element={<ServiceAnalytics />} />
            <Route path="by-therapist" element={<TherapistAnalytics />} />
          </Route>
          <Route path="schedule-settings" element={<ScheduleSettings />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" />
    </ThemeProvider>
  );
}

export default App;
