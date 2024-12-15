import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, addDays, isSameDay, subDays, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { sr } from 'date-fns/locale';
import {
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { toast } from 'react-toastify';
import appointmentService from '../services/appointmentService';
import therapistService from '../services/therapistService';
import clientService from '../services/clientService';
import scheduleService from '../services/scheduleService';
import { useAuth } from '../hooks/useAuth';
import { AppointmentDetailsModal } from '../components/appointments/AppointmentDetailsModal';

interface DashboardStats {
  periodAppointments: number;
  activeClients: number;
  totalRevenue: number;
}

interface ChartData {
  date: string;
  turnover: number;
  appointments: number;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  client: {
    name: string;
  };
  service: {
    name: string;
  };
  therapist: {
    name: string;
  };
}

interface Therapist {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface WorkingHours {
  id: string;
  startTime: string;
  endTime: string;
}

type TimeFrame = {
  label: string;
  value: string;
  startDate: () => Date;
  endDate: () => Date;
};

const timeFrameOptions: TimeFrame[] = [
  // Future periods
  {
    label: 'Sledećih 30 dana',
    value: 'next30days',
    startDate: () => new Date(),
    endDate: () => addDays(new Date(), 29)
  },
  {
    label: 'Sledećih 14 dana',
    value: 'next14days',
    startDate: () => new Date(),
    endDate: () => addDays(new Date(), 13)
  },
  {
    label: 'Sledećih 7 dana',
    value: 'next7days',
    startDate: () => new Date(),
    endDate: () => addDays(new Date(), 6)
  },
  // Present period
  {
    label: 'Ovaj mesec',
    value: 'thisMonth',
    startDate: () => startOfMonth(new Date()),
    endDate: () => endOfMonth(new Date())
  },
  // Past periods
  {
    label: 'Poslednjih 7 dana',
    value: 'last7days',
    startDate: () => subDays(new Date(), 6),
    endDate: () => new Date()
  },
  {
    label: 'Poslednjih 14 dana',
    value: 'last14days',
    startDate: () => subDays(new Date(), 13),
    endDate: () => new Date()
  },
  {
    label: 'Poslednjih 30 dana',
    value: 'last30days',
    startDate: () => subDays(new Date(), 29),
    endDate: () => new Date()
  },
  {
    label: 'Prošli mesec',
    value: 'lastMonth',
    startDate: () => startOfMonth(subMonths(new Date(), 1)),
    endDate: () => endOfMonth(subMonths(new Date(), 1))
  },
  {
    label: 'Poslednja 3 meseca',
    value: 'last3months',
    startDate: () => subMonths(new Date(), 3),
    endDate: () => new Date()
  },
  // Custom period
  {
    label: 'Prilagođeni period',
    value: 'custom',
    startDate: () => new Date(),
    endDate: () => new Date()
  }
];

export default function Dashboard() {
  const { isAuthenticated, accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    periodAppointments: 0,
    activeClients: 0,
    totalRevenue: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('last7days');
  const [customDateRange, setCustomDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [timeFrameText, setTimeFrameText] = useState('');

  const [futureAppointments, setFutureAppointments] = useState<Appointment[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);

  const calculateTotalTurnover = (appointments: Appointment[]) => {
    return appointments
      .filter(appointment => 
        appointment.status !== 'CANCELLED' && 
        appointment.status !== 'NO_SHOW' &&
        appointment.status !== 'OTKAZANO' && 
        appointment.status !== 'NIJE_DOŠAO'
      )
      .reduce((total, appointment) => total + (appointment.price || 0), 0);
  };

  const showError = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const fetchDashboardData = async (start: Date, end: Date) => {
    try {
      setIsLoading(true);
      if (!isAuthenticated || !accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/dashboard/stats?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      console.log('Received dashboard data:', data);
      
      setStats({
        periodAppointments: data.periodAppointments || 0,
        activeClients: data.activeClients || 0,
        totalRevenue: data.totalTurnover || 0
      });

      if (data.chartData) {
        const formattedChartData = data.chartData.map((item: any) => ({
          date: item.date,
          turnover: item.turnover,
          appointments: item.appointments
        }));
        console.log('Formatted chart data:', formattedChartData);
        setChartData(formattedChartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Došlo je do greške prilikom učitavanja podataka');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      if (!isAuthenticated || !accessToken) {
        console.error('No authentication token found');
        return;
      }

      console.log('Fetching upcoming appointments...');
      const appointments = await appointmentService.getUpcomingAppointments();
      console.log('Received upcoming appointments:', appointments);
      setUpcomingAppointments(appointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  };

  useEffect(() => {
    const getDateRange = () => {
      const selectedOption = timeFrameOptions.find(option => option.value === selectedTimeFrame);
      if (selectedOption) {
        return {
          start: startOfDay(selectedOption.startDate()),
          end: endOfDay(selectedOption.endDate())
        };
      }

      // Default to last 7 days if no option is found
      const now = new Date();
      return {
        start: subDays(startOfDay(now), 6),
        end: endOfDay(now)
      };
    };

    const dateRange = getDateRange();
    if (dateRange) {
      fetchDashboardData(dateRange.start, dateRange.end);
    }
  }, [selectedTimeFrame]);

  useEffect(() => {
    const interval = setInterval(fetchUpcomingAppointments, 60000);
    fetchUpcomingAppointments();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const end = new Date();
        const start = subDays(end, 7);
        await fetchDashboardData(start, end);
      } catch (error) {
        console.error('Error in dashboard data fetch:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [therapistsData, clientsData, workingHoursData] = await Promise.all([
        therapistService.getTherapists(),
        clientService.getAllClients(),
        scheduleService.getWorkingHours(),
      ]);

      setTherapists(therapistsData);
      setClients(clientsData);
      setWorkingHours(workingHoursData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // showError('Došlo je do greške prilikom učitavanja podataka');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const baseStyle = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
      case 'ZAKAZANO':
        return `${baseStyle} bg-blue-100 text-blue-700`;
      case 'CONFIRMED':
      case 'POTVRĐENO':
        return `${baseStyle} bg-green-100 text-green-700`;
      case 'IN_PROGRESS':
      case 'U_TOKU':
        return `${baseStyle} bg-purple-100 text-purple-700`;
      case 'COMPLETED':
      case 'ZAVRŠENO':
        return `${baseStyle} bg-indigo-100 text-indigo-700`;
      case 'CANCELLED':
      case 'OTKAZANO':
        return `${baseStyle} bg-red-100 text-red-700`;
      case 'NO_SHOW':
      case 'NIJE_DOŠAO':
        return `${baseStyle} bg-gray-100 text-gray-700`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-700`;
    }
  };

  const getLocalizedStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'Zakazano';
      case 'CONFIRMED':
        return 'Potvrđeno';
      case 'IN_PROGRESS':
        return 'U toku';
      case 'COMPLETED':
        return 'Završeno';
      case 'CANCELLED':
        return 'Otkazano';
      case 'NO_SHOW':
        return 'Nije došao';
      default:
        return status;
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedAppointment(null);
    setIsDetailsModalOpen(false);
  };

  const handleUpdateAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      setIsLoading(true);
      if (!appointmentData.id) {
        console.error('Appointment ID is missing');
        return;
      }
      await appointmentService.updateAppointment(appointmentData.id, appointmentData);
      console.log('Appointment updated successfully');
      await fetchUpcomingAppointments();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      setIsLoading(true);
      await appointmentService.deleteAppointment(appointmentId);
      console.log('Appointment deleted successfully');
      await fetchUpcomingAppointments();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppointmentList = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedAppointments = upcomingAppointments.slice(startIndex, endIndex);

    return (
      <div className="mt-4">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vreme
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klijent
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usluga
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terapeut
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cena
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-900">
                    {format(new Date(appointment.startTime), 'dd.MM.yyyy HH:mm', { locale: sr })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                    {appointment.client.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                    {appointment.service.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                    {appointment.therapist.name}
                  </td>
                  <td className="px-3 py-2">
                    <span className={getStatusBadgeStyle(appointment.status)}>
                      {getLocalizedStatus(appointment.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                    {appointment.price.toLocaleString('sr-RS')} RSD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between w-full">
            <div className="text-sm text-gray-700">
              Prikazano <span className="font-medium">{startIndex + 1}</span> do{' '}
              <span className="font-medium">{Math.min(endIndex, upcomingAppointments.length)}</span> od{' '}
              <span className="font-medium">{upcomingAppointments.length}</span> termina
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Prethodna
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(upcomingAppointments.length / itemsPerPage), p + 1))}
                  disabled={page >= Math.ceil(upcomingAppointments.length / itemsPerPage)}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page >= Math.ceil(upcomingAppointments.length / itemsPerPage) ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Sledeća
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Termina u periodu
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {isLoading ? '-' : stats.periodAppointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <UserGroupIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aktivni Klijenti
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {isLoading ? '-' : stats.activeClients}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ukupan Prihod
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {isLoading ? '-' : `${stats.totalRevenue.toLocaleString()} RSD`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Statistika</h2>
          <select
            value={selectedTimeFrame}
            onChange={(e) => setSelectedTimeFrame(e.target.value)}
            className="ml-4 p-2 border rounded-md"
          >
            {timeFrameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#82ca9d" />
              <YAxis yAxisId="right" orientation="right" stroke="#8884d8" />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'Prihod') {
                    return [`${value.toLocaleString('sr-RS')} RSD`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="turnover" fill="#82ca9d" name="Prihod" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="appointments" 
                stroke="#8884d8" 
                name="Broj termina"
                strokeWidth={3}
                dot={{ strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Predstojeći Termini</h2>
        {renderAppointmentList()}
      </div>

      {selectedAppointment && (
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
    </div>
  );
}
