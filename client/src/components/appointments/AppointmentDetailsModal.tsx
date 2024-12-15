import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { Client, Therapist, WorkingHours } from '../../services/clientService';
import { AppointmentModal } from './AppointmentModal';

interface AppointmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: (appointment: Partial<Appointment>) => Promise<void>;
  onDelete?: (appointmentId: string) => Promise<void>;
  onConfirm?: (appointmentId: string) => Promise<void>;
  onCancel?: (appointmentId: string) => Promise<void>;
  onComplete?: (appointmentId: string) => Promise<void>;
  onNoShow?: (appointmentId: string) => Promise<void>;
  isLoading?: boolean;
  therapists: Therapist[];
  clients: Client[];
  workingHours: WorkingHours[];
}

const statusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: '#ffa726',
  [AppointmentStatus.CONFIRMED]: '#66bb6a',
  [AppointmentStatus.IN_PROGRESS]: '#42a5f5',
  [AppointmentStatus.COMPLETED]: '#4caf50',
  [AppointmentStatus.CANCELLED]: '#ef5350',
  [AppointmentStatus.NO_SHOW]: '#9e9e9e',
};

const statusOptions = [
  { value: AppointmentStatus.SCHEDULED, label: 'Zakazano' },
  { value: AppointmentStatus.CONFIRMED, label: 'Potvrđeno' },
  { value: AppointmentStatus.IN_PROGRESS, label: 'U toku' },
  { value: AppointmentStatus.COMPLETED, label: 'Završeno' },
  { value: AppointmentStatus.CANCELLED, label: 'Otkazano' },
  { value: AppointmentStatus.NO_SHOW, label: 'Nije se pojavio/la' },
];

export function AppointmentDetailsModal({
  open,
  onClose,
  appointment,
  onUpdate,
  onDelete,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  isLoading = false,
  therapists,
  clients,
  workingHours,
}: AppointmentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShowEditModal(false);
      setActionLoading(null);
    }
  }, [open]);

  const handleClose = () => {
    setShowEditModal(false);
    setActionLoading(null);
    onClose();
  };

  const handleAction = async (
    action: 'confirm' | 'cancel' | 'complete' | 'no-show' | 'delete',
    handler?: (id: string) => Promise<void>
  ) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(appointment.id);
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async (updatedData: Partial<Appointment>) => {
    console.log('AppointmentDetailsModal - Updating appointment with data:', updatedData);
    try {
      const updatePayload = {
        id: appointment.id,
        clientId: updatedData.clientId || appointment.client?.id || appointment.clientId,
        therapistId: updatedData.therapistId || appointment.therapist?.id || appointment.therapistId,
        serviceId: updatedData.serviceId || appointment.service?.id || appointment.serviceId,
        startTime: updatedData.startTime?.toISOString() || appointment.startTime,
        endTime: updatedData.endTime?.toISOString() || appointment.endTime,
        status: updatedData.status || appointment.status,
        notes: updatedData.notes ?? appointment.notes,
        price: updatedData.price ?? appointment.price
      };
      console.log('AppointmentDetailsModal - Sending update payload:', updatePayload);
      await onUpdate(updatePayload);
      console.log('AppointmentDetailsModal - Update successful');
      setShowEditModal(false);
    } catch (error) {
      console.error('AppointmentDetailsModal - Error updating appointment:', error);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        TransitionProps={{
          onExited: () => {
            setShowEditModal(false);
            setActionLoading(null);
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Detalji termina
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              disabled={isLoading}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Status
              </Typography>
              <Chip
                label={statusOptions.find((option) => option.value === appointment.status)?.label}
                sx={{
                  bgcolor: statusColors[appointment.status],
                  color: 'white',
                  fontWeight: 'bold',
                  height: '24px',
                  '& .MuiChip-label': {
                    fontSize: '0.8rem',
                    py: 0.5
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Vreme
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.25 }}>
                {format(new Date(appointment.startTime), 'PPP')}
              </Typography>
              <Typography variant="body2">
                {appointment.startTime && format(new Date(appointment.startTime), 'HH:mm')} -{' '}
                {appointment.endTime && format(new Date(appointment.endTime), 'HH:mm')}
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Klijent
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.25 }}>{appointment.client?.name}</Typography>
              {appointment.client?.phone && (
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                  {appointment.client.phone}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Terapeut
              </Typography>
              <Typography variant="body2">{appointment.therapist?.name}</Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Usluga
              </Typography>
              <Typography variant="body2">{appointment.service?.name}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                Cena: {appointment.price?.toLocaleString('sr-RS')} RSD
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" color="textSecondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                Napomena
              </Typography>
              <Typography variant="body2">
                {appointment.notes || 'Nema napomene'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ flexDirection: 'column', p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, width: '100%', mb: 1 }}>
            {appointment.status === AppointmentStatus.SCHEDULED && onConfirm && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleAction('confirm', onConfirm)}
                disabled={actionLoading !== null}
                startIcon={
                  actionLoading === 'confirm' ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                Potvrdi
              </Button>
            )}
            {(appointment.status === AppointmentStatus.SCHEDULED ||
              appointment.status === AppointmentStatus.CONFIRMED) &&
              onCancel && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => handleAction('cancel', onCancel)}
                  disabled={actionLoading !== null}
                  startIcon={
                    actionLoading === 'cancel' ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CancelIcon />
                    )
                  }
                >
                  Otkaži
                </Button>
              )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            {appointment.status === AppointmentStatus.CONFIRMED && onComplete && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={() => handleAction('complete', onComplete)}
                disabled={actionLoading !== null}
                startIcon={
                  actionLoading === 'complete' ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                Završi
              </Button>
            )}
            {appointment.status === AppointmentStatus.CONFIRMED && onNoShow && (
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={() => handleAction('no-show', onNoShow)}
                disabled={actionLoading !== null}
                startIcon={
                  actionLoading === 'no-show' ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CancelIcon />
                  )
                }
              >
                Nije se pojavio/la
              </Button>
            )}
          </Box>
          {onDelete && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Button
                fullWidth
                variant="text"
                color="error"
                onClick={() => handleAction('delete', onDelete)}
                disabled={actionLoading !== null}
                startIcon={
                  actionLoading === 'delete' ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DeleteIcon />
                  )
                }
              >
                Obriši termin
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {showEditModal && (
        <AppointmentModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          clients={clients}
          therapists={therapists}
          workingHours={workingHours}
          appointment={appointment}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
