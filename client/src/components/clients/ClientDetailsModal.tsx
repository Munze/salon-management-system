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
import { Client, CreateClientData } from '../../services/clientService';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';

interface ClientDetailsModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (client: Client) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function ClientDetailsModal({
  open,
  onClose,
  client,
  onSave,
  onDelete,
  isLoading = false,
}: ClientDetailsModalProps) {
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedClient(client);
    setErrors({});
    setDeleteConfirm(false);
    setIsEditing(false);
  }, [client]);

  if (!editedClient) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!editedClient.name) {
      newErrors.name = 'Ime je obavezno';
    }
    if (!editedClient.email) {
      newErrors.email = 'Email je obavezan';
    } else if (!/\S+@\S+\.\S+/.test(editedClient.email)) {
      newErrors.email = 'Neispravan format email-a';
    }
    if (!editedClient.phone) {
      newErrors.phone = 'Broj telefona je obavezan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateClientData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditedClient({
      ...editedClient,
      [field]: event.target.value,
    });
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedClient);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    if (deleteConfirm) {
      onDelete(editedClient.id);
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
          Detalji Klijenta
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
          value={editedClient.name}
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
          value={editedClient.email}
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
          value={editedClient.phone}
          onChange={handleInputChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Adresa"
          fullWidth
          multiline
          rows={2}
          value={editedClient.address || ''}
          onChange={handleInputChange('address')}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Napomene"
          fullWidth
          multiline
          rows={3}
          value={editedClient.notes || ''}
          onChange={handleInputChange('notes')}
          disabled={!isEditing}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Kreirano
          </Typography>
          <Typography variant="body2">
            {editedClient.createdAt ? format(new Date(editedClient.createdAt), 'PPpp', { locale: sr }) : ''}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Poslednje Ažuriranje
          </Typography>
          <Typography variant="body2">
            {editedClient.updatedAt ? format(new Date(editedClient.updatedAt), 'PPpp', { locale: sr }) : ''}
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
          {deleteConfirm ? 'Potvrdi Brisanje' : 'Obriši Klijenta'}
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
              Izmeni Klijenta
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
