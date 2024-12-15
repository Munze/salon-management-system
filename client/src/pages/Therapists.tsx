import { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CreateTherapistModal } from '../components/therapists/CreateTherapistModal';
import { TherapistDetailsModal } from '../components/therapists/TherapistDetailsModal';
import therapistService, { Therapist, CreateTherapistData } from '../services/therapistService';

export default function Therapists() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setIsLoading(true);
      const fetchedTherapists = await therapistService.getTherapists();
      setTherapists(fetchedTherapists);
    } catch (err) {
      setError('Greška pri učitavanju terapeuta');
      console.error('Error fetching therapists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTherapist = async (therapistData: CreateTherapistData) => {
    try {
      setIsLoading(true);
      const createdTherapist = await therapistService.createTherapist(therapistData);
      setTherapists(prevTherapists => [...prevTherapists, createdTherapist]);
      setIsCreateModalOpen(false);
      setSnackbarMessage(
        `Terapeut je uspešno kreiran. ${createdTherapist.generatedPassword ? 
          `Lozinka: ${createdTherapist.generatedPassword}` : ''}`
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error creating therapist:', err);
      setSnackbarMessage('Greška pri kreiranju terapeuta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTherapist = async (updatedTherapist: Therapist) => {
    try {
      setIsLoading(true);
      const { id, ...therapistData } = updatedTherapist;
      await therapistService.updateTherapist(id, therapistData);
      setTherapists(prevTherapists =>
        prevTherapists.map(therapist =>
          therapist.id === updatedTherapist.id ? updatedTherapist : therapist
        )
      );
      setSnackbarMessage('Terapeut je uspešno ažuriran');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Error updating therapist:', err);
      setSnackbarMessage('Greška pri ažuriranju terapeuta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTherapist = async (therapistId: string) => {
    try {
      setIsLoading(true);
      await therapistService.deleteTherapist(therapistId);
      setTherapists(prevTherapists =>
        prevTherapists.filter(therapist => therapist.id !== therapistId)
      );
      setSnackbarMessage('Terapeut je uspešno obrisan');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Error deleting therapist:', err);
      setSnackbarMessage('Greška pri brisanju terapeuta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(therapist =>
    therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Terapeuti</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Novi Terapeut
        </Button>
      </div>

      <div className="mb-6">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pretraži terapeute..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ime</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Specijalnost</TableCell>
              <TableCell width={90} align="center">Akcije</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredTherapists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Nema pronađenih terapeuta
                </TableCell>
              </TableRow>
            ) : (
              filteredTherapists.map((therapist) => (
                <TableRow key={therapist.id}>
                  <TableCell>{therapist.name}</TableCell>
                  <TableCell>{therapist.email}</TableCell>
                  <TableCell>{therapist.phone || '-'}</TableCell>
                  <TableCell>{therapist.specialties?.join(', ') || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => {
                        setSelectedTherapist(therapist);
                        setIsDetailsModalOpen(true);
                      }}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateTherapistModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTherapist}
        isLoading={isLoading}
      />

      <TherapistDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        therapist={selectedTherapist}
        onSave={handleUpdateTherapist}
        onDelete={handleDeleteTherapist}
        isLoading={isLoading}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
