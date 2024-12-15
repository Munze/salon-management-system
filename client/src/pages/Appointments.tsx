import { useState, useEffect, useRef } from 'react';
import { DateSelectArg } from '@fullcalendar/core';
import { AppointmentCalendar } from '../components/appointments/AppointmentCalendar';
import { CreateAppointmentModal } from '../components/appointments/CreateAppointmentModal';
import { AppointmentDetailsModal } from '../components/appointments/AppointmentDetailsModal';
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import appointmentService from '../services/appointmentService';
import { Appointment, CreateAppointmentData } from '../services/appointmentService';
import clientService from '../services/clientService';
import therapistService from '../services/therapistService';
import scheduleService from '../services/scheduleService';
import serviceService from '../services/serviceService';
import { Client } from '../types/client';
import { Therapist } from '../types/therapist';
import { WorkingHours } from '../types/schedule';
import { Service } from '../services/serviceService'; 

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [initialEndTime, setInitialEndTime] = useState<Date | undefined>(undefined);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [scrollTime, setScrollTime] = useState<string>('09:00:00');
  const [key, setKey] = useState(0); // Add a key to force re-render
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    console.log('Fetching data...');
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Starting data fetch...');
      const [appointmentsData, clientsData, therapistsData, workingHoursData, servicesData] = await Promise.all([
        appointmentService.getAllAppointments(),
        clientService.getAllClients(),
        therapistService.getTherapists(),
        scheduleService.getWorkingHours(),
        serviceService.getAllServices(),
      ]);

      console.log('Received clients:', clientsData);
      setAppointments(appointmentsData);
      setClients(clientsData);
      setTherapists(therapistsData);
      if (workingHoursData && workingHoursData.length > 0) {
        // Ensure all required properties are present
        const validWorkingHours = workingHoursData.map((hours: WorkingHours) => ({
          id: hours.id || '',
          dayOfWeek: hours.dayOfWeek || 'MONDAY',
          startTime: hours.startTime || '09:00',
          endTime: hours.endTime || '17:00',
          isWorkingDay: hours.isWorkingDay ?? true,
          therapistId: hours.therapistId || ''
        }));
        setWorkingHours(validWorkingHours);
      }
      setServices(servicesData);
    } catch (err) {
      showError('Došlo je do greške prilikom učitavanja podataka');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      setIsLoading(true);
      const createdAppointment = await appointmentService.createAppointment(appointmentData as CreateAppointmentData);
      showSuccess('Termin je uspešno zakazan');
      
      // Store the start time before fetching new data
      const newAppointmentDate = new Date(appointmentData.startTime as string);
      const hours = newAppointmentDate.getHours();
      const minutes = newAppointmentDate.getMinutes();
      // Calculate scroll time 30 minutes before the appointment
      const scrollHour = hours > 0 ? hours - 1 : hours;
      const scrollTimeString = `${scrollHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      await fetchData();
      setIsCreateModalOpen(false);
      setScrollTime(scrollTimeString);
      setCurrentDate(newAppointmentDate);
      setCurrentView('timeGridWeek');
      setKey(prev => prev + 1); // Force calendar re-render

    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = 'Termin se preklapa sa postojećim terminom';
      showError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      setIsLoading(true);
      console.log('Appointments - Updating appointment:', appointmentData);
      
      if (!appointmentData.id) {
        console.error('Appointments - No appointment ID provided for update');
        showError('Došlo je do greške prilikom ažuriranja termina');
        return;
      }

      await appointmentService.updateAppointment(appointmentData.id, appointmentData);
      console.log('Appointments - Update successful');
      showSuccess('Termin je uspešno ažuriran');
      await fetchData();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Appointments - Error updating appointment:', error);
      showError('Došlo je do greške prilikom ažuriranja termina');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      setIsLoading(true);
      await appointmentService.deleteAppointment(appointmentId);
      setIsDetailsModalOpen(false);
      showSuccess('Termin je uspešno obrisan');
      
      // Store current view state
      const api = calendarRef.current?.getApi();
      const viewType = api?.view.type;
      const viewDate = api?.view.currentStart;
      
      // Fetch new data
      await fetchData();
      
      // Wait for next render and restore view
      setTimeout(() => {
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          if (viewType) api.changeView(viewType);
          if (viewDate) api.gotoDate(viewDate);
        }
      }, 0);
    } catch (error) {
      showError('Došlo je do greške prilikom brisanja termina');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('Date selected:', selectInfo);
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    
    setSelectedDate(startDate);
    setInitialEndTime(endDate);
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (appointment: Appointment) => {
    console.log('Event clicked:', appointment);
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleViewChange = (viewType: string) => {
    console.log('View changed to:', viewType);
    setCurrentView(viewType);
  };

  const handleDatesSet = (dateInfo: { view: { currentStart: Date; type: string } }) => {
    console.log('Dates changed:', dateInfo);
    setCurrentDate(dateInfo.view.currentStart);
  };

  const showError = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  const showSuccess = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            const now = new Date();
            setSelectedDate(now);
            setInitialEndTime(new Date(now.getTime() + 30 * 60000)); // Add 30 minutes
            setIsCreateModalOpen(true);
          }}
        >
          Novi Termin
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </div>
      ) : (
        <AppointmentCalendar
          key={key} // Add key to force re-render
          ref={calendarRef}
          appointments={appointments}
          onSelectSlot={handleDateSelect}
          onSelectEvent={handleEventClick}
          onViewChange={handleViewChange}
          onDatesSet={handleDatesSet}
          view={{ currentStart: currentDate, type: currentView }}
          workingHours={workingHours?.[0]}
          therapists={therapists}
          initialView={currentView}
          initialDate={currentDate}
          scrollTime={scrollTime}
        />
      )}

      {isCreateModalOpen && (
        <CreateAppointmentModal
          open={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedDate(undefined);
            setInitialEndTime(undefined);
          }}
          selectedDate={selectedDate}
          onSubmit={handleCreateAppointment}
          isLoading={isLoading}
          clients={clients}
          therapists={therapists}
          services={services}
          initialDate={selectedDate}
          initialEndTime={initialEndTime}
          onClientCreated={(newClient) => {
            setClients(prevClients => [...prevClients, newClient]);
          }}
        />
      )}

      {isDetailsModalOpen && selectedAppointment && (
        <AppointmentDetailsModal
          open={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          appointment={selectedAppointment}
          onUpdate={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          isLoading={isLoading}
          therapists={therapists}
          clients={clients}
          workingHours={workingHours}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
