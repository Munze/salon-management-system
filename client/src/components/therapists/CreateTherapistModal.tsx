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
} from '@mui/material';
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { CreateTherapistData } from '../../services/therapistService';

interface CreateTherapistModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (therapistData: CreateTherapistData) => void;
  isLoading?: boolean;
}

interface FormData extends CreateTherapistData {}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function CreateTherapistModal({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateTherapistModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    specialties: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name) {
      newErrors.name = 'Ime je obavezno';
    }
    if (!formData.email) {
      newErrors.email = 'Email je obavezan';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neispravan format email-a';
    }
    if (!formData.phone) {
      newErrors.phone = 'Broj telefona je obavezan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
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
        Novi Terapeut
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
          value={formData.name}
          onChange={handleInputChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          value={formData.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Telefon"
          fullWidth
          value={formData.phone}
          onChange={handleInputChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Specijalnosti"
          fullWidth
          value={formData.specialties.join(', ')}
          onChange={(e) => {
            const specialties = e.target.value.split(',').map(s => s.trim()).filter(s => s);
            setFormData(prev => ({ ...prev, specialties }));
          }}
          helperText="Unesite specijalnosti odvojene zarezom"
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Otkaži</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          Kreiraj Terapeuta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
