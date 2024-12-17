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
  CardActionArea
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
import { fetchTherapistAnalytics } from '../services/analyticsService';

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

const TherapistAnalytics: React.FC = () => {
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
      const data = await fetchTherapistAnalytics(startDate, endDate);
      setAnalyticsData(data);
    } catch (err) {
      setError('Greška pri učitavanju podataka analitike terapeuta');
      console.error('Greška pri učitavanju analitike terapeuta:', err);
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
      setEndDate(now);
      setStartDate(subDays(now, range.days - 1));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { therapists, overallStats } = analyticsData;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  };

  // Prepare data for the therapist performance chart
  const therapistPerformanceData = {
    labels: therapists.map((t: any) => t.name),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Prihod',
        data: therapists.map((t: any) => t.metrics.totalRevenue),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Broj termina',
        data: therapists.map((t: any) => t.metrics.totalAppointments),
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
    labels: therapists[0]?.monthlyTrends.map((m: any) => {
      try {
        const date = new Date(m.month);
        if (isNaN(date.getTime())) return '';
        const daysDiff = differenceInDays(endDate, startDate);
        
        if (daysDiff <= 30) {
          return format(date, 'dd.MM.'); // Daily format
        } else if (daysDiff <= 90) {
          return format(date, 'dd.MM.'); // Weekly format
        } else {
          return format(date, 'MMM yyyy'); // Monthly format
        }
      } catch (error) {
        return '';
      }
    }) || [],
    datasets: therapists.map((therapist: any, index: number) => ({
      label: therapist.name,
      data: therapist.monthlyTrends.map((m: any) => m.revenue),
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
                Prosečan prihod po terapeutu
              </Typography>
              <Typography variant="h5">
                {formatCurrency(overallStats.averageRevenuePerTherapist)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikon performansi terapeuta */}
      <Card mb={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pregled performansi terapeuta
          </Typography>
          <Box height={400}>
            <Bar
              data={therapistPerformanceData}
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

      {/* Detaljna metrika terapeuta */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaljna metrika terapeuta
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ime terapeuta</TableCell>
                  <TableCell align="right">Ukupan prihod</TableCell>
                  <TableCell align="right">Broj termina</TableCell>
                  <TableCell align="right">Jedinstveni klijenti</TableCell>
                  <TableCell align="right">Prosečan prihod po terminu</TableCell>
                  <TableCell align="right">Popunjenost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {therapists.map((therapist: any) => (
                  <TableRow key={therapist.id}>
                    <TableCell>{therapist.name}</TableCell>
                    <TableCell align="right">{formatCurrency(therapist.metrics.totalRevenue)}</TableCell>
                    <TableCell align="right">{therapist.metrics.totalAppointments}</TableCell>
                    <TableCell align="right">{therapist.metrics.uniqueClients}</TableCell>
                    <TableCell align="right">{formatCurrency(therapist.metrics.averageRevenuePerAppointment)}</TableCell>
                    <TableCell align="right">{(therapist.metrics.occupancyRate * 100).toFixed(1)}%</TableCell>
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

export default TherapistAnalytics;
