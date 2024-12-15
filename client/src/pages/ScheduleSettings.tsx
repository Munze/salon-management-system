import { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import scheduleService, {
  WorkingHours,
  ScheduleException,
  CreateWorkingHoursData,
  CreateScheduleExceptionData,
} from '../services/scheduleService';
import { WorkingHoursForm } from '../components/schedule/WorkingHoursForm';
import { ScheduleExceptionForm } from '../components/schedule/ScheduleExceptionForm';
import * as scheduleSettingsService from '../services/scheduleSettingsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScheduleSettings() {
  const [activeTab, setActiveTab] = useState(0);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<scheduleSettingsService.ScheduleSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchWorkingHours();
    fetchExceptions();
    fetchScheduleSettings();
  }, []);

  const fetchWorkingHours = async () => {
    setIsLoading(true);
    try {
      const hours = await scheduleService.getWorkingHours();
      // Ensure we have valid working hours data
      if (Array.isArray(hours)) {
        const validHours = hours.filter(hour => 
          hour && 
          hour.dayOfWeek && 
          hour.startTime && 
          hour.endTime && 
          typeof hour.isWorkingDay === 'boolean'
        );
        setWorkingHours(validHours);
      } else {
        setWorkingHours([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri učitavanju radnog vremena');
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      // Set empty array on error
      setWorkingHours([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExceptions = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      const exceptions = await scheduleService.getScheduleExceptions(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setExceptions(exceptions);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri učitavanju izuzetaka rasporeda');
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduleSettings = async () => {
    try {
      const settings = await scheduleSettingsService.getScheduleSettings();
      setScheduleSettings(settings);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri učitavanju podešavanja rasporeda');
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSaveWorkingHours = async (data: CreateWorkingHoursData[]) => {
    try {
      setIsLoading(true);
      // Validate the data before sending
      const validData = data.filter(item => 
        item && 
        item.dayOfWeek && 
        item.startTime && 
        item.endTime && 
        typeof item.isWorkingDay === 'boolean'
      );
      
      if (validData.length === 0) {
        throw new Error('Nema validnih podataka za čuvanje');
      }
      
      await scheduleService.updateWorkingHours(validData);
      await fetchWorkingHours();
      setSnackbarMessage('Radno vreme ažurirano uspešno');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri ažuriranju radnog vremena');
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateException = async (data: CreateScheduleExceptionData) => {
    try {
      setIsLoading(true);
      await scheduleService.createScheduleException(data);
      await fetchExceptions();
      setIsExceptionModalOpen(false);
      setSnackbarMessage('Izuzetak rasporeda dodat uspešno');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri dodavanju izuzetka rasporeda');
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      setIsLoading(true);
      await scheduleService.deleteScheduleException(id);
      await fetchExceptions();
      setSnackbarMessage('Izuzetak rasporeda obrisan uspešno');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri brisanju izuzetka rasporeda');
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScheduleSettings = async (field: keyof scheduleSettingsService.ScheduleSettings, value: any) => {
    if (!scheduleSettings) return;

    try {
      setIsLoading(true);
      const updatedSettings = await scheduleSettingsService.updateScheduleSettings({
        ...scheduleSettings,
        [field]: value
      });
      setScheduleSettings(updatedSettings);
      setSnackbarMessage('Podešavanja rasporeda su uspešno ažurirana');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error || (err as any).response) {
        const errorMessage = (err as any).response?.data?.message || 
                             (err instanceof Error ? err.message : 'Greška pri ažuriranju podešavanja rasporeda');
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Podešavanja Rasporeda</h1>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="schedule settings tabs"
        >
          <Tab label="Radno Vreme" />
          <Tab label="Izuzeci" />
          <Tab label="Opšta Podešavanja" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Postavite Redovno Radno Vreme
        </Typography>
        <WorkingHoursForm
          workingHours={workingHours}
          onSave={handleSaveWorkingHours}
          isLoading={isLoading}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Izuzeci Rasporeda
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsExceptionModalOpen(true)}
          >
            Dodaj Izuzetak
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Sati</TableCell>
                <TableCell>Beleška</TableCell>
                <TableCell width={90} align="center">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exceptions.map((exception) => (
                <TableRow key={exception.id}>
                  <TableCell>{format(new Date(exception.date), 'PP')}</TableCell>
                  <TableCell>
                    {exception.isWorkingDay ? 'Specijalni Sati' : 'Zatvoreno'}
                  </TableCell>
                  <TableCell>
                    {exception.isWorkingDay && exception.startTime && exception.endTime
                      ? `${exception.startTime} - ${exception.endTime}`
                      : '-'}
                  </TableCell>
                  <TableCell>{exception.note || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteException(exception.id)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {exceptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nema pronađenih izuzetaka rasporeda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Opšta Podešavanja Rasporeda
        </Typography>
        
        {scheduleSettings && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Podrazumevano Trajanje Termina (minuta)"
                type="number"
                value={scheduleSettings.defaultAppointmentDuration}
                onChange={(e) => handleUpdateScheduleSettings('defaultAppointmentDuration', parseInt(e.target.value))}
                inputProps={{ min: 15, max: 240 }}
              />
              
              <TextField
                label="Pauza Između Termina (minuta)"
                type="number"
                value={scheduleSettings.bufferBetweenAppointments}
                onChange={(e) => handleUpdateScheduleSettings('bufferBetweenAppointments', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 60 }}
              />
              
              <TextField
                label="Maksimalan Broj Dana za Zakazivanje Unapred"
                type="number"
                value={scheduleSettings.maxAdvanceBookingDays}
                onChange={(e) => handleUpdateScheduleSettings('maxAdvanceBookingDays', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 365 }}
              />
              
              <TextField
                label="Minimalan Broj Sati za Zakazivanje Unapred"
                type="number"
                value={scheduleSettings.minAdvanceBookingHours}
                onChange={(e) => handleUpdateScheduleSettings('minAdvanceBookingHours', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 48 }}
              />
            </Box>
          </Paper>
        )}
      </TabPanel>

      <ScheduleExceptionForm
        open={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        onSubmit={handleCreateException}
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
