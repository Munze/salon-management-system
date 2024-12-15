import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  MenuItem, CircularProgress, IconButton, Box, FormControl, InputLabel, Select, Grid, FormHelperText } from '@mui/material';
import { Alert, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import { CreateAppointmentData } from '../../services/appointmentService';
import { Service } from '../../services/serviceService';
import CloseIcon from '@mui/icons-material/Close';
import { addMinutes, format } from 'date-fns';
import { sr } from 'date-fns/locale';
import scheduleService from '../../services/scheduleService';
import { roundToNextQuarter } from '../../utils/dateUtils';
import { QuickCreateClientModal } from '../clients/QuickCreateClientModal';
import { CustomDateTimePicker } from '../common/CustomDateTimePicker';

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSubmit: (data: CreateAppointmentData) => void;
  isLoading: boolean;
  clients: Client[];
  therapists: Therapist[];
  services: Service[];
  initialDate?: Date;
  initialEndTime?: Date;
  onClientCreated?: (client: Client) => void;
}

interface FormData {
  startTime: Date;
  endTime: Date;
  clientId: string;
  therapistId: string;
  serviceId: string;
  notes: string;
  price: number;
}

interface FormErrors {
  startTime?: string;
  endTime?: string;
  clientId?: string;
  therapistId?: string;
  serviceId?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Therapist {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export function CreateAppointmentModal({
  open,
  onClose,
  selectedDate,
  onSubmit,
  isLoading,
  clients,
  therapists,
  services,
  initialDate,
  initialEndTime,
  onClientCreated
}: CreateAppointmentModalProps) {
  console.log('CreateAppointmentModal props:', { clients, therapists, services });
  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date();
    const startTime = roundToNextQuarter(now);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    return {
      startTime: initialDate || startTime,
      endTime: initialEndTime || endTime,
      clientId: '',
      therapistId: '',
      serviceId: '',
      notes: '',
      price: 0
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setFormData(prev => {
        const startTime = initialDate;
        let endTime = initialEndTime;
        
        // If we have a selected service, use its duration
        if (prev.serviceId) {
          const selectedService = services.find(service => service.id === prev.serviceId);
          if (selectedService) {
            endTime = addMinutes(startTime, selectedService.duration);
          }
        } else if (!endTime) {
          // Default to 30 minutes if no service selected and no end time provided
          endTime = addMinutes(startTime, 30);
        }
        
        return {
          ...prev,
          startTime,
          endTime
        };
      });
    }
  }, [initialDate, initialEndTime, services]);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};
    setErrorMessage('');
    setShowError(false);

    if (!formData.clientId) {
      newErrors.clientId = 'Klijent je obavezan';
    }
    if (!formData.therapistId) {
      newErrors.therapistId = 'Terapeut je obavezan';
    }
    if (!formData.serviceId) {
      newErrors.serviceId = 'Usluga je obavezna';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Početak je obavezan';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Kraj je obavezan';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Kraj mora biti posle početka';
    }

    // Check availability
    if (formData.startTime && formData.endTime && formData.therapistId && !Object.keys(newErrors).length) {
      setIsCheckingAvailability(true);
      try {
        const startTimeStr = format(formData.startTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const endTimeStr = format(formData.endTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        
        const response = await scheduleService.checkAvailability(
          startTimeStr,
          endTimeStr,
          formData.therapistId
        );
        
        if (!response.available) {
          let errorMessage = response.message || 'Termin nije dostupan';
          
          if (!response.message) {
            if (response.reason === 'outside_working_hours') {
              errorMessage = 'Termin je van radnog vremena';
            } else if (response.reason === 'overlap') {
              errorMessage = 'Termin se preklapa sa postojećim terminom';
            }
          }
          
          setErrorMessage(errorMessage);
          setShowError(true);
          return false;
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setErrorMessage('Greška pri proveri dostupnosti termina');
        setShowError(true);
        return false;
      } finally {
        setIsCheckingAvailability(false);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (await validateForm()) {
        const appointmentData: CreateAppointmentData = {
          startTime: formData.startTime,
          endTime: formData.endTime,
          clientId: formData.clientId,
          therapistId: formData.therapistId,
          serviceId: formData.serviceId,
          notes: formData.notes,
          price: formData.price
        };
        try {
          await onSubmit(appointmentData);
          onClose();
        } catch (error: any) {
          console.error('Error submitting form:', error);
          setErrorMessage('Termin se preklapa sa postojećim terminom');
          setShowError(true);
        }
      }
    } catch (error) {
      console.error('Error validating form:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'serviceId') {
      const selectedService = services.find(s => s.id === value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        endTime: selectedService 
          ? addMinutes(prev.startTime, selectedService.duration)
          : prev.endTime,
        price: selectedService ? selectedService.price : 0
      }));
    } else if (field === 'startTime' && value) {
      const selectedService = services.find(s => s.id === formData.serviceId);
      setFormData(prev => ({
        ...prev,
        startTime: value,
        endTime: selectedService ? addMinutes(value, selectedService.duration) : value
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleServiceChange = (event: SelectChangeEvent<string>) => {
    const serviceId = event.target.value;
    const selectedService = services.find(service => service.id === serviceId);
    
    setFormData(prev => {
      const newEndTime = selectedService 
        ? addMinutes(prev.startTime, selectedService.duration)
        : prev.startTime;
      
      return {
        ...prev,
        serviceId,
        endTime: newEndTime,
        price: selectedService ? selectedService.price : 0
      };
    });
  };

  const handleStartTimeChange = (newStartTime: Date | null) => {
    if (!newStartTime) return;
    
    setFormData(prev => {
      // Calculate current duration in minutes
      const currentDuration = (prev.endTime.getTime() - prev.startTime.getTime()) / 60000;
      
      // Apply the same duration to the new start time
      const newEndTime = new Date(newStartTime.getTime() + currentDuration * 60000);
      
      return {
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime
      };
    });
  };

  const handleEndTimeChange = (newEndTime: Date | null) => {
    if (!newEndTime) return;
    setFormData(prev => ({
      ...prev,
      endTime: newEndTime
    }));
  };

  return (
    <>
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Novi Termin
            <IconButton onClick={onClose} disabled={isLoading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.clientId}>
                  <InputLabel>Klijent</InputLabel>
                  <Select
                    value={formData.clientId}
                    onChange={(e) => {
                      if (e.target.value === 'create_new') {
                        setShowCreateClientModal(true);
                      } else {
                        handleInputChange('clientId', e.target.value);
                      }
                    }}
                    label="Klijent"
                  >
                    <MenuItem value="create_new" sx={{ 
                      fontWeight: 'bold', 
                      borderBottom: '1px solid #e0e0e0',
                      color: 'primary.main'
                    }}>
                      + Kreiraj Novog Klijenta
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.clientId && <FormHelperText>{errors.clientId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.therapistId}>
                  <InputLabel>Terapeut</InputLabel>
                  <Select
                    value={formData.therapistId}
                    onChange={(e) => handleInputChange('therapistId', e.target.value)}
                    label="Terapeut"
                  >
                    {therapists.map((therapist) => (
                      <MenuItem key={therapist.id} value={therapist.id}>
                        {therapist.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.therapistId && <FormHelperText>{errors.therapistId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.serviceId}>
                  <InputLabel>Usluga</InputLabel>
                  <Select
                    value={formData.serviceId}
                    onChange={(e) => handleInputChange('serviceId', e.target.value)}
                    label="Usluga"
                  >
                    {services.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.serviceId && <FormHelperText>{errors.serviceId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <CustomDateTimePicker
                      label="Početak termina"
                      value={formData.startTime}
                      onChange={(newDate) => newDate && handleStartTimeChange(newDate)}
                      disabled={isLoading}
                      format="dd.MM.yyyy HH:mm"
                      error={errors.startTime}
                      views={['year', 'month', 'day', 'hours', 'minutes']}
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
                      error={errors.endTime}
                      views={['year', 'month', 'day', 'hours', 'minutes']}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Napomena"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cena"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Otkaži
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Sačuvaj'}
          </Button>
        </DialogActions>
      </Dialog>

      <QuickCreateClientModal
        open={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onClientCreated={(newClient) => {
          handleInputChange('clientId', newClient.id);
          onClientCreated?.(newClient);
          setShowCreateClientModal(false);
        }}
      />
    </>
  );
}
