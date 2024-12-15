import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { sr } from 'date-fns/locale';
import { appointmentService, therapistService } from '../services';
import { Appointment, Therapist } from '../types';

// Define some colors for therapists
const THERAPIST_COLORS = {
  'Milica': '#fef08a',    // yellow
  'Jovana': '#f97316',    // orange
  'Stefan': '#86efac',    // green
};

export default function Home() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Generate array of 7 days starting from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, therapistsData] = await Promise.all([
        appointmentService.getAppointments(),
        therapistService.getTherapists()
      ]);
      setAppointments(appointmentsData);
      setTherapists(therapistsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(app => isSameDay(new Date(app.startTime), date))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const getTherapistColor = (therapistName: string) => {
    return THERAPIST_COLORS[therapistName] || '#e5e7eb'; // default gray if no color defined
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Kalendar
      </Typography>

      <Paper sx={{ height: 'calc(100vh - 150px)', overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Učitavanje...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', height: '100%' }}>
            {/* Time column */}
            <Box sx={{ borderRight: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
              {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                <Box 
                  key={hour}
                  sx={{ 
                    height: '100px',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}
                >
                  {`${hour}:00`}
                </Box>
              ))}
            </Box>

            {/* Day columns */}
            {weekDays.map(day => (
              <Box 
                key={day.toISOString()} 
                sx={{ 
                  borderRight: 1, 
                  borderColor: 'divider',
                  minWidth: 200
                }}
              >
                {/* Day header */}
                <Box sx={{ 
                  p: 1, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <Typography align="center">
                    {format(day, 'EEE dd/MM', { locale: sr })}
                  </Typography>
                </Box>

                {/* Appointments */}
                <Box sx={{ position: 'relative', height: 1300 }}> {/* 13 hours * 100px */}
                  {getDayAppointments(day).map(appointment => {
                    const startHour = new Date(appointment.startTime).getHours();
                    const startMinutes = new Date(appointment.startTime).getMinutes();
                    const endHour = new Date(appointment.endTime).getHours();
                    const endMinutes = new Date(appointment.endTime).getMinutes();
                    
                    const top = ((startHour - 8) * 100) + (startMinutes / 60 * 100);
                    const height = ((endHour - startHour) * 100) + ((endMinutes - startMinutes) / 60 * 100);
                    
                    const therapist = therapists.find(t => t.id === appointment.therapistId);
                    const bgColor = therapist ? getTherapistColor(therapist.name) : '#e5e7eb';

                    return (
                      <Box
                        key={appointment.id}
                        sx={{
                          position: 'absolute',
                          top: `${top}px`,
                          left: '4px',
                          right: '4px',
                          height: `${height}px`,
                          bgcolor: bgColor,
                          borderRadius: 1,
                          p: 1,
                          opacity: appointment.status === 'CANCELLED' ? 0.5 : 1,
                          overflow: 'hidden',
                          '&:hover': {
                            zIndex: 1,
                            boxShadow: 2
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                          {format(new Date(appointment.startTime), 'HH:mm')}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {appointment.client.name}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {appointment.service.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
