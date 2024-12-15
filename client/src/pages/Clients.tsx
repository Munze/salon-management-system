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
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CreateClientModal } from '../components/clients/CreateClientModal';
import { ClientDetailsModal } from '../components/clients/ClientDetailsModal';
import { ClientHistoryModal } from '../components/clients/ClientHistoryModal';
import clientService, { Client, CreateClientData } from '../services/clientService';
import { useAuth } from '../hooks/useAuth';

export default function Clients() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [clientHistory, setClientHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuClient, setMenuClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const fetchedClients = await clientService.getAllClients();
      setClients(fetchedClients);
    } catch (err) {
      setError('Greška pri učitavanju klijenata');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (clientData: CreateClientData) => {
    try {
      setIsLoading(true);
      const createdClient = await clientService.createClient(clientData);
      setClients(prevClients => [...prevClients, createdClient]);
      setIsCreateModalOpen(false);
      setSnackbarMessage('Klijent je uspešno kreiran');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error creating client:', err);
      setSnackbarMessage('Greška pri kreiranju klijenta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      setIsLoading(true);
      const { id, ...clientData } = updatedClient;
      await clientService.updateClient(id, clientData);
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      setSnackbarMessage('Klijent je uspešno ažuriran');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Error updating client:', err);
      setSnackbarMessage('Greška pri ažuriranju klijenta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      setIsLoading(true);
      await clientService.deleteClient(clientId);
      setClients(prevClients =>
        prevClients.filter(client => client.id !== clientId)
      );
      setSnackbarMessage('Klijent je uspešno obrisan');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Error deleting client:', err);
      setSnackbarMessage('Greška pri brisanju klijenta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = async (client: Client, timeframe: string = 'thisMonth') => {
    try {
      console.log('Fetching history for client:', client.id);
      const history = await clientService.getClientHistory(client.id, timeframe);
      console.log('Received history:', history);
      setClientHistory(history);
      setSelectedClient(client);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching client history:', error);
      setSnackbarMessage('Greška pri učitavanju istorije klijenta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, client: Client) => {
    setAnchorEl(event.currentTarget);
    setMenuClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuClient(null);
  };

  const handleMenuAction = (action: 'edit' | 'history' | 'delete') => {
    if (!menuClient) return;

    switch (action) {
      case 'edit':
        setSelectedClient(menuClient);
        setIsDetailsModalOpen(true);
        break;
      case 'history':
        handleViewHistory(menuClient);
        break;
      case 'delete':
        handleDeleteClient(menuClient.id);
        break;
    }
    handleMenuClose();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Klijenti</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedClient(null);
            setIsCreateModalOpen(true);
          }}
        >
          Novi Klijent
        </Button>
      </div>

      <div className="mb-6">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pretraži klijente..."
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
          Greška pri učitavanju klijenata
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ime</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Adresa</TableCell>
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
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Nema pronađenih klijenata
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.address || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(event) => handleMenuOpen(event, client)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            fontSize: '0.875rem',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
            }
          }
        }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>Izmeni</MenuItem>
        <MenuItem onClick={() => handleMenuAction('history')}>Istorija</MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>Obriši</MenuItem>
      </Menu>

      <CreateClientModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={isLoading}
      />

      <ClientDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        client={selectedClient}
        onSave={handleUpdateClient}
        onDelete={handleDeleteClient}
        isLoading={isLoading}
      />

      {isHistoryModalOpen && selectedClient && (
        <ClientHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          client={selectedClient}
          history={clientHistory}
          handleTimeframeChange={(timeframe) => handleViewHistory(selectedClient!, timeframe)}
        />
      )}

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
