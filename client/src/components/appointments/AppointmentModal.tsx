import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  FormHelperText,
  Grid
} from '@mui/material';
import { Client } from '../../types/client';
import { Therapist } from '../../types/therapist';
import { WorkingHours } from '../../types/schedule';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { isWithinWorkingHours } from '../../utils/dateUtils';
import { CustomDateTimePicker } from '../common/CustomDateTimePicker';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (appointment: Partial<Appointment>) => Promise<void>;
  clients: Client[];
  therapists: Therapist[];
  workingHours: WorkingHours[];
  appointment?: Appointment;
  isLoading?: boolean;
  initialStartTime?: Date;
  initialEndTime?: Date;
}

export function AppointmentModal({
  open,
  onClose,
  onSubmit,
  clients,
  therapists,
  workingHours,
  appointment,
  isLoading = false,
  initialStartTime,
  initialEndTime,
}: AppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    clientId: '',
    therapistId: '',
    startTime: initialStartTime || new Date(),
    endTime: initialEndTime || new Date(Date.now() + 30 * 60 * 1000),
    status: AppointmentStatus.SCHEDULED,
    notes: '',
    price: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointment) {
      console.log('Setting form data from appointment:', appointment);
      setFormData({
        clientId: appointment.client?.id || appointment.clientId || '',
        therapistId: appointment.therapist?.id || appointment.therapistId || '',
        serviceId: appointment.service?.id || appointment.serviceId || '',
        startTime: new Date(appointment.startTime),
        endTime: new Date(appointment.endTime),
        status: appointment.status,
        notes: appointment.notes || '',
        price: appointment.price || 0
      });
    } else if (initialStartTime) {
      setFormData(prev => ({
        ...prev,
        startTime: initialStartTime,
        endTime: initialEndTime || new Date(initialStartTime.getTime() + 30 * 60 * 1000)
      }));
    }
  }, [appointment, initialStartTime, initialEndTime]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Klijent je obavezan';
    }

    if (!formData.therapistId) {
      newErrors.therapistId = 'Terapeut je obavezan';
    }

    if (!formData.startTime || !formData.endTime) {
      newErrors.time = 'Početak i kraj termina su obavezni';
    } else {
      // Check if dates are on different days
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      
      if (startDate.getDate() !== endDate.getDate() ||
          startDate.getMonth() !== endDate.getMonth() ||
          startDate.getFullYear() !== endDate.getFullYear()) {
        newErrors.time = 'Početak i kraj moraju biti istog dana';
        console.log('Dates are on different days:', { startDate, endDate });
      }
      // Check if end time is after start time
      else if (formData.endTime <= formData.startTime) {
        newErrors.time = 'Kraj mora biti nakon početka';
      }
      // Check working hours if therapist is selected
      else if (formData.therapistId) {
        console.log('Checking against working hours:', workingHours);
        
        if (!isWithinWorkingHours(formData.startTime, formData.endTime, workingHours)) {
          newErrors.time = 'Termin mora biti unutar radnog vremena';
        }
      }
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartTimeChange = (newStartTime: Date | null) => {
    if (!newStartTime) return;
    
    // When start time changes, adjust end time to be on the same day
    setFormData(prev => {
      const prevEndTime = new Date(prev.endTime);
      const newEndTime = new Date(newStartTime);
      newEndTime.setHours(prevEndTime.getHours(), prevEndTime.getMinutes());
      
      return {
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime
      };
    });
  };

  const handleEndTimeChange = (newEndTime: Date | null) => {
    if (!newEndTime) return;
    
    // When end time changes, ensure it's on the same day as start time
    setFormData(prev => {
      const newEndTimeAdjusted = new Date(newEndTime);
      const startDate = new Date(prev.startTime);
      
      newEndTimeAdjusted.setFullYear(startDate.getFullYear());
      newEndTimeAdjusted.setMonth(startDate.getMonth());
      newEndTimeAdjusted.setDate(startDate.getDate());
      
      return {
        ...prev,
        endTime: newEndTimeAdjusted
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AppointmentModal - Submitting form with data:', formData);

    const isValid = validateForm();
    if (!isValid) {
      console.log('AppointmentModal - Form validation failed:', errors);
      return;
    }

    try {
      const appointmentData: Partial<Appointment> = {
        id: appointment?.id,
        clientId: formData.clientId,
        therapistId: formData.therapistId,
        serviceId: formData.serviceId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
        notes: formData.notes,
        price: formData.price
      };

      await onSubmit(appointmentData);
      console.log('AppointmentModal - Form submitted successfully');
      onClose();
    } catch (error) {
      console.error('AppointmentModal - Error submitting form:', error);
      setErrors({
        submit: 'Failed to save appointment. Please try again.'
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      onClick={(e) => e.stopPropagation()}
      TransitionProps={{
        onExited: () => {
          setFormData({
            clientId: '',
            therapistId: '',
            startTime: initialStartTime || new Date(),
            endTime: initialEndTime || new Date(),
            status: AppointmentStatus.SCHEDULED,
            notes: '',
            price: 0
          });
          setErrors({});
        }
      }}
    >
      <DialogTitle>
        {appointment ? 'Izmeni Termin' : 'Novi Termin'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Klijent</InputLabel>
              <Select
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value as string })}
                label="Klijent"
              >
                {(clients || []).map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.clientId && <FormHelperText>{errors.clientId}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Terapeut</InputLabel>
              <Select
                value={formData.therapistId || ''}
                onChange={(e) => setFormData({ ...formData, therapistId: e.target.value as string })}
                label="Terapeut"
              >
                {(therapists || []).map((therapist) => (
                  <MenuItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.therapistId && <FormHelperText>{errors.therapistId}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <CustomDateTimePicker
                label="Početak termina"
                value={formData.startTime}
                onChange={(newDate) => newDate && handleStartTimeChange(newDate)}
                disabled={isLoading}
                format="dd.MM.yyyy HH:mm"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomDateTimePicker
                label="Kraj termina"
                value={formData.endTime}
                onChange={(newDate) => newDate && handleEndTimeChange(newDate)}
                disabled={isLoading}
                minDate={formData.startTime}
                format="dd.MM.yyyy HH:mm"
              />
            </Grid>
          </Grid>
          {appointment && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as AppointmentStatus,
                    })
                  }
                  label="Status"
                >
                  {(Object.values(AppointmentStatus) || []).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status === 'SCHEDULED' ? 'Zakazano' : 
                       status === 'CONFIRMED' ? 'Potvrđeno' : 
                       status === 'IN_PROGRESS' ? 'U toku' : 
                       status === 'COMPLETED' ? 'Završeno' : 
                       status === 'CANCELLED' ? 'Otkazano' : 
                       status === 'NO_SHOW' ? 'Nije se pojavio/la' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              label="Napomena"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Cena"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
            />
          </Grid>
          {errors.submit && (
            <Grid item xs={12}>
              <Typography color="error" variant="body2">
                {errors.submit}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Otkaži
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {appointment ? 'Izmeni' : 'Sačuvaj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
