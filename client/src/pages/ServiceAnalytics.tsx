import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, subDays, startOfMonth, endOfMonth, subMonths, addDays, differenceInDays } from 'date-fns';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchServiceAnalytics } from '../services/analyticsService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const timeRanges = [
  { label: 'Sledećih 30 dana', days: 30, future: true },
  { label: 'Sledećih 14 dana', days: 14, future: true },
  { label: 'Sledećih 7 dana', days: 7, future: true },
  { label: 'Ovaj mesec', type: 'thisMonth' },
  { label: 'Poslednjih 7 dana', days: 7 },
  { label: 'Poslednjih 14 dana', days: 14 },
  { label: 'Poslednjih 30 dana', days: 30 },
  { label: 'Prošli mesec', type: 'lastMonth' },
  { label: 'Poslednja 3 meseca', days: 90 },
  { label: 'Prilagođeni period', type: 'custom' }
];

const ServiceAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState(3); // Default to "Ovaj mesec"
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceAnalytics(startDate, endDate);
      setAnalyticsData(data);
    } catch (err) {
      setError('Greška pri učitavanju podataka analitike usluga');
      console.error('Greška pri učitavanju podataka analitike usluga:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (event: any) => {
    const rangeIndex = event.target.value;
    setSelectedRange(rangeIndex);
    const range = timeRanges[rangeIndex];
    
    if (range.type === 'custom') {
      setShowCustomDatePicker(true);
      return;
    }
    
    setShowCustomDatePicker(false);
    const now = new Date();
    
    if (range.type === 'thisMonth') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
    } else if (range.type === 'lastMonth') {
      const lastMonth = subMonths(now, 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
    } else if (range.future) {
      setStartDate(now);
      setEndDate(addDays(now, range.days));
    } else {
      setStartDate(subDays(now, range.days - 1));
      setEndDate(now);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!analyticsData) {
    return null;
  }

  const { services, overallStats } = analyticsData;

  // Prepare data for the service performance chart
  const servicePerformanceData = {
    labels: services.map((s: any) => s.name),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Prihod',
        data: services.map((s: any) => s.metrics.totalRevenue),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Broj termina',
        data: services.map((s: any) => s.metrics.totalAppointments),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 2,
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        order: 1,
      },
    ],
  };

  // Prepare data for the monthly trends chart
  const monthlyTrendsData = {
    labels: services[0]?.monthlyTrends.map((m: any) => {
      const date = new Date(m.month);
      const daysDiff = differenceInDays(endDate, startDate);
      
      // Format based on time range
      if (daysDiff <= 30) {
        return format(date, 'dd.MM.'); // Daily format
      } else if (daysDiff <= 90) {
        return format(date, 'dd.MM.'); // Weekly format (will be grouped in backend)
      } else {
        return format(date, 'MMM yyyy', { locale: 'sr-Latn' }); // Monthly format
      }
    }),
    datasets: services.map((service: any, index: number) => ({
      label: service.name,
      data: service.monthlyTrends.map((m: any) => m.revenue),
      borderColor: index === 0 ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)',
      backgroundColor: index === 0 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(75, 192, 192, 0.5)',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
    })),
  };

  return (
    <Box p={3}>
      <Box mb={3} display="flex" gap={2} alignItems="center">
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel>Vremenski period</InputLabel>
          <Select value={selectedRange} onChange={handleRangeChange} label="Vremenski period">
            {timeRanges.map((range, index) => (
              <MenuItem key={range.label} value={index}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {showCustomDatePicker && (
          <>
            <DatePicker
              label="Početni datum"
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
            />
            <DatePicker
              label="Krajnji datum"
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
            />
          </>
        )}
      </Box>

      {/* Ukupna statistika */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ukupan prihod
              </Typography>
              <Typography variant="h5">
                {formatCurrency(overallStats.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ukupno termina
              </Typography>
              <Typography variant="h5">
                {overallStats.totalAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Jedinstvenih klijenata
              </Typography>
              <Typography variant="h5">
                {overallStats.uniqueClients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prosečan prihod po usluzi
              </Typography>
              <Typography variant="h5">
                {formatCurrency(overallStats.averageRevenuePerService)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikon performansi usluga */}
      <Card mb={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pregled performansi usluga
          </Typography>
          <Box height={400}>
            <Bar
              data={servicePerformanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                scales: {
                  y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                      display: true,
                      text: 'Prihod (RSD)'
                    },
                    beginAtZero: true,
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: 'Broj termina'
                    },
                    beginAtZero: true,
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.dataset.yAxisID === 'y') {
                          label += new Intl.NumberFormat('sr-RS', {
                            style: 'currency',
                            currency: 'RSD'
                          }).format(context.parsed.y);
                        } else {
                          label += context.parsed.y;
                        }
                        return label;
                      }
                    }
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Grafikon mesečnih trendova */}
      <Card mb={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mesečni trend prihoda
          </Typography>
          <Box height={400}>
            <Line
              data={monthlyTrendsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'nearest' as const,
                  axis: 'x' as const,
                  intersect: false
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Prihod (RSD)'
                    },
                    ticks: {
                      callback: (value) => 
                        new Intl.NumberFormat('sr-RS', {
                          style: 'decimal',
                          maximumFractionDigits: 0
                        }).format(value as number)
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)',
                      drawBorder: false
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                    align: 'center' as const,
                    labels: {
                      boxWidth: 15,
                      usePointStyle: true,
                      pointStyle: 'circle'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        label += new Intl.NumberFormat('sr-RS', {
                          style: 'currency',
                          currency: 'RSD'
                        }).format(context.parsed.y);
                        return label;
                      }
                    }
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Detaljna metrika usluga */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaljna metrika usluga
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Naziv usluge</TableCell>
                  <TableCell align="right">Ukupan prihod</TableCell>
                  <TableCell align="right">Broj termina</TableCell>
                  <TableCell align="right">Jedinstveni klijenti</TableCell>
                  <TableCell align="right">Prosečna cena</TableCell>
                  <TableCell align="right">Standardna cena</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service: any) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell align="right">{formatCurrency(service.metrics.totalRevenue)}</TableCell>
                    <TableCell align="right">{service.metrics.totalAppointments}</TableCell>
                    <TableCell align="right">{service.metrics.uniqueClients}</TableCell>
                    <TableCell align="right">{formatCurrency(service.metrics.avgPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(service.metrics.standardPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceAnalytics;
