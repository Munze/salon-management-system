import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Therapist, CreateTherapistData } from '../../services/therapistService';
import { format } from 'date-fns';

interface TherapistDetailsModalProps {
  open: boolean;
  onClose: () => void;
  therapist: Therapist | null;
  onSave: (therapist: Therapist) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function TherapistDetailsModal({
  open,
  onClose,
  therapist,
  onSave,
  onDelete,
  isLoading = false,
}: TherapistDetailsModalProps) {
  const [editedTherapist, setEditedTherapist] = useState<Therapist | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedTherapist(therapist);
    setErrors({});
    setDeleteConfirm(false);
    setIsEditing(false);
  }, [therapist]);

  if (!editedTherapist) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!editedTherapist.name) {
      newErrors.name = 'Ime je obavezno';
    }
    if (!editedTherapist.email) {
      newErrors.email = 'Email je obavezan';
    } else if (!/\S+@\S+\.\S+/.test(editedTherapist.email)) {
      newErrors.email = 'Neispravan format email-a';
    }
    if (!editedTherapist.phone) {
      newErrors.phone = 'Broj telefona je obavezan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateTherapistData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditedTherapist({
      ...editedTherapist,
      [field]: event.target.value,
    });
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedTherapist);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    if (deleteConfirm) {
      onDelete(editedTherapist.id);
    } else {
      setDeleteConfirm(true);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'relative',
          p: 2,
        },
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="h6" component="div">
          Detalji Terapeuta
        </Typography>
        <IconButton
          aria-label="zatvori"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          margin="dense"
          label="Ime"
          fullWidth
          value={editedTherapist.name}
          onChange={handleInputChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          value={editedTherapist.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Telefon"
          fullWidth
          value={editedTherapist.phone}
          onChange={handleInputChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Specijalnost"
          fullWidth
          value={editedTherapist.specialty || ''}
          onChange={handleInputChange('specialty')}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Biografija"
          fullWidth
          multiline
          rows={3}
          value={editedTherapist.bio || ''}
          onChange={handleInputChange('bio')}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Kreirano
          </Typography>
          <Typography variant="body2">
            {format(new Date(editedTherapist.createdAt), 'PPpp')}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Poslednje Ažuriranje
          </Typography>
          <Typography variant="body2">
            {format(new Date(editedTherapist.updatedAt), 'PPpp')}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Button
          onClick={handleDeleteClick}
          color="error"
          startIcon={<DeleteIcon />}
          disabled={isLoading}
        >
          {deleteConfirm ? 'Potvrdi Brisanje' : 'Obriši Terapeuta'}
        </Button>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Zatvori
          </Button>
          {isEditing ? (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
            >
              Sačuvaj Izmene
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Izmeni Terapeuta
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
