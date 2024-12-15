import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Fade,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';
import { format, parseISO, differenceInDays, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { TimeframeSelector } from '../components/TimeframeSelector';
import { analyticsService, type AnalyticsData, type AnalyticsFilter } from '../services/analyticsService';
import { StatCard } from '../components/StatCard';
import { startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];

const theme = {
  fontFamily: 'Roboto, sans-serif',
  fontSize: 12,
};

const formatNumber = (num: number) => {
  return num.toLocaleString('sr-RS');
};

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<AnalyticsFilter | undefined>();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Ovaj mesec');
  const [timeframe, setTimeframe] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date())
  ]);

  useEffect(() => {
    console.log('Fetching data with timeframe:', {
      start: timeframe[0].toISOString(),
      end: timeframe[1].toISOString()
    });
    fetchData();
  }, [timeframe, currentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.fetchAnalytics(
        timeframe[0],
        timeframe[1],
        currentFilter
      );
      console.log('Fetched analytics data:', data);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    setCurrentFilter(prev => 
      prev?.type === 'service' && prev.value === serviceId
        ? undefined
        : { type: 'service', value: serviceId }
    );
  };

  const handleTherapistClick = (therapistId: string) => {
    setCurrentFilter(prev =>
      prev?.type === 'therapist' && prev.value === therapistId
        ? undefined
        : { type: 'therapist', value: therapistId }
    );
  };

  const handleTimeframeChange = (newTimeframe: [Date, Date], label: string) => {
    console.log('Changing timeframe to:', {
      start: newTimeframe[0].toISOString(),
      end: newTimeframe[1].toISOString(),
      label
    });
    setTimeframe(newTimeframe);
    setSelectedTimeframe(label);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <Box sx={{ p: 3, fontFamily: theme.fontFamily }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" sx={{ fontFamily: theme.fontFamily }}>
              Analitika za {selectedTimeframe.toLowerCase()}
            </Typography>
            <TimeframeSelector 
              onChange={handleTimeframeChange} 
              selectedTimeframe={selectedTimeframe}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="UKUPAN PRIHOD"
            value={`${formatNumber(analyticsData?.currentPeriod.totalRevenue || 0)} RSD`}
            unit="RSD"
            previousValue={`${formatNumber(analyticsData?.previousPeriod.totalRevenue || 0)} RSD`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="BROJ TERMINA"
            value={analyticsData?.currentPeriod.totalAppointments || 0}
            previousValue={analyticsData?.previousPeriod.totalAppointments || 0}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="UKUPNO KLIJENATA"
            value={analyticsData?.currentPeriod.totalClients || 0}
            unit="klijenata"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: theme.fontFamily }}>
              Prihod po Danima
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analyticsData?.currentPeriod.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const daysDiff = differenceInDays(
                      parseISO(timeframe[1].toISOString()),
                      parseISO(timeframe[0].toISOString())
                    );
                    
                    if (daysDiff <= 30) {
                      return format(parseISO(date), 'dd.MM');
                    } else if (daysDiff <= 90) {
                      return `W${getWeek(parseISO(date))}`;
                    } else {
                      return format(parseISO(date), 'MMM');
                    }
                  }}
                  tick={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  tickFormatter={(value) => formatNumber(value)}
                  tick={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
                />
                <YAxis 
                  yAxisId="appointments"
                  orientation="right"
                  tickFormatter={(value) => Math.round(value)}
                  tick={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Prihod') return [`${formatNumber(value)} RSD`, name];
                    return [value, name];
                  }}
                  labelFormatter={(date) => {
                    const daysDiff = differenceInDays(
                      parseISO(timeframe[1].toISOString()),
                      parseISO(timeframe[0].toISOString())
                    );
                    
                    if (daysDiff <= 30) {
                      return format(parseISO(date), 'dd.MM.yyyy');
                    } else if (daysDiff <= 90) {
                      const startOfWeek = startOfWeek(parseISO(date));
                      const endOfWeek = endOfWeek(parseISO(date));
                      return `${format(startOfWeek, 'dd.MM')} - ${format(endOfWeek, 'dd.MM.yyyy')}`;
                    } else {
                      return format(parseISO(date), 'MMMM yyyy');
                    }
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '10px',
                    fontFamily: theme.fontFamily, 
                    fontSize: theme.fontSize 
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Prihod"
                  fill="#4CAF50"
                  yAxisId="revenue"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments"
                  name="Broj termina"
                  stroke="#9C27B0"
                  yAxisId="appointments"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: theme.fontFamily }}>
              Po uslugama
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.currentPeriod.serviceDistribution || []}
                  dataKey="revenue"
                  nameKey="serviceName"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelStyle={{ 
                    fontSize: '0.65rem',
                    fontFamily: theme.fontFamily
                  }}
                >
                  {(analyticsData?.currentPeriod.serviceDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${formatNumber(value)} RSD`}
                  contentStyle={{ 
                    fontFamily: theme.fontFamily, 
                    fontSize: '0.7rem' 
                  }}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '0.75rem',
                    fontFamily: theme.fontFamily
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: theme.fontFamily }}>
              Prihod po Terapeutu
            </Typography>
            {analyticsData?.currentPeriod?.revenueByTherapist && analyticsData.currentPeriod.revenueByTherapist.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={analyticsData.currentPeriod.revenueByTherapist}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  options={{
                    responsive: true,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          title: (context) => {
                            const therapist = context[0].label;
                            const totalRevenue = context.reduce((sum, item) => sum + (item.raw as number), 0);
                            const totalServices = context.reduce((sum, item) => sum + (item.raw as number > 0 ? 1 : 0), 0);
                            return [
                              `Therapist: ${therapist}`,
                              `Total Revenue: ${formatNumber(totalRevenue)} RSD`,
                              `Services Offered: ${totalServices}`
                            ];
                          },
                          label: (context) => {
                            const value = context.raw as number;
                            if (value === 0) return null;
                            return `${context.dataset.label}: ${formatNumber(value)} RSD`;
                          }
                        }
                      },
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                    scales: {
                      x: {
                        stacked: true,
                        ticks: {
                          autoSkip: false,
                          maxRotation: 0,
                          minRotation: 0
                        }
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatNumber(value as number)
                        }
                      }
                    },
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="therapistName"
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatNumber(value)}
                    tick={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      return [`${formatNumber(value as number)} RSD`, name];
                    }}
                    labelFormatter={(label) => label}
                    contentStyle={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontSize
                    }}
                  />
                  {analyticsData.currentPeriod.services.map((service, index) => (
                    <Bar
                      key={service.id}
                      dataKey={service.name}
                      name={service.name}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <Typography sx={{ fontFamily: theme.fontFamily, color: 'text.secondary' }}>
                  {loading ? 'Loading...' : 'No data available'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
