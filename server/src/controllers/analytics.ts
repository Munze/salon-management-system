import { Request, Response } from 'express';
import { PrismaClient, Status } from '@prisma/client';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay,
  endOfDay,
  isSameDay,
  isSameMonth,
  differenceInDays,
  addDays,
  addMonths,
  parseISO,
  format,
  addWeeks,
  startOfWeek,
  isBefore,
  isWithinInterval
} from 'date-fns';

const prisma = new PrismaClient();

interface AnalyticsFilter {
  type?: 'therapist' | 'service';
  value?: string;
}

// Helper function to group appointments by time period
const groupAppointmentsByPeriod = (appointments: any[], startDate: Date, endDate: Date): { month: string; revenue: number }[] => {
  const trends: { month: string; revenue: number }[] = [];
  const daysDiff = differenceInDays(endDate, startDate);

  // For shorter periods (up to 90 days), group by day
  if (daysDiff <= 90) {
    let currentDate = startOfDay(startDate);
    while (currentDate <= endDate) {
      const dayAppointments = appointments.filter(app => 
        isSameDay(new Date(app.startTime), currentDate)
      );
      
      const dayRevenue = dayAppointments.reduce((sum, app) => sum + app.price, 0);
      
      trends.push({
        month: currentDate.toISOString(),
        revenue: dayRevenue
      });
      
      currentDate = addDays(currentDate, 1);
    }
  }
  // For longer periods, group by month
  else {
    let currentDate = startOfMonth(startDate);
    while (currentDate <= endDate) {
      const monthAppointments = appointments.filter(app => 
        isSameMonth(new Date(app.startTime), currentDate)
      );
      
      const monthRevenue = monthAppointments.reduce((sum, app) => sum + app.price, 0);
      
      trends.push({
        month: currentDate.toISOString(),
        revenue: monthRevenue
      });
      
      currentDate = addMonths(currentDate, 1);
    }
  }
  
  return trends;
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user as any;
    const filter: AnalyticsFilter = req.query;

    console.log('User requesting analytics:', { 
      email: user.email, 
      role: user.role,
      id: user.id
    });

    if (!user || !user.email) {
      console.error('No user or email found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Received date range:', { startDate, endDate });
    
    const start = startOfDay(parseISO(startDate as string));
    const end = endOfDay(parseISO(endDate as string));
    console.log('Parsed date range:', { start, end });

    let therapistId: string | undefined;

    // If user is a therapist, get their ID
    if (user.role === 'THERAPIST') {
      console.log('User is a therapist, finding therapist record by email:', user.email);
      
      try {
        const therapist = await prisma.therapist.findUnique({
          where: { email: user.email },
          include: {
            appointments: {
              include: {
                service: true,
                client: true,
                therapist: true
              }
            }
          }
        });
        
        console.log('Found therapist:', therapist);
        
        if (!therapist) {
          console.log('No therapist found for email:', user.email);
          return res.status(404).json({ message: 'Therapist not found' });
        }
        
        therapistId = therapist.id;
      } catch (error) {
        console.error('Error finding therapist:', error);
        return res.status(500).json({ message: 'Error finding therapist' });
      }
    }

    // Get all services first
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    });

    // Get appointments in date range
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: {
            in: ['CANCELLED', 'NO_SHOW'] as Status[]
          }
        },
        ...(filter.type === 'therapist' && filter.value && {
          therapistId: filter.value
        }),
        ...(filter.type === 'service' && filter.value && {
          serviceId: filter.value
        }),
        ...(therapistId && {
          therapistId
        })
      },
      include: {
        service: true,
        therapist: true,
        client: true,
      }
    });

    console.log('Found appointments:', appointments.length);

    // Calculate total revenue
    const totalRevenue = appointments.reduce((sum, apt) => {
      if (apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW') {
        return sum + (apt.price || 0);
      }
      return sum;
    }, 0);

    // Calculate total appointments
    const totalAppointments = appointments.length;

    // Get total number of clients
    const totalClientsWhereClause: any = {};
    if (therapistId) {
      totalClientsWhereClause.appointments = {
        some: {
          therapistId: therapistId
        }
      };
    }
    const totalClients = await prisma.client.count({
      where: totalClientsWhereClause
    });

    // Get new clients in period
    const newClients = await prisma.client.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        }
      }
    });

    // Get revenue by service
    const revenueByService = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: {
            in: ['CANCELLED', 'NO_SHOW'] as Status[]
          }
        }
      },
      _sum: {
        price: true
      }
    });

    // First get all therapists
    const therapists = await prisma.therapist.findMany({
      where: {
        appointments: {
          some: {
            startTime: {
              gte: start,
              lte: end,
            },
            NOT: {
              status: {
                in: ['CANCELLED', 'NO_SHOW'] as Status[]
              }
            }
          }
        }
      },
      include: {
        appointments: {
          where: {
            startTime: {
              gte: start,
              lte: end,
            },
            NOT: {
              status: {
                in: ['CANCELLED', 'NO_SHOW'] as Status[]
              }
            }
          },
          include: {
            service: true,
            client: true,
            therapist: true
          }
        }
      }
    });

    console.log('Found therapists:', therapists.map(t => ({ 
      id: t.id, 
      name: t.name,
      appointmentCount: t.appointments.length 
    })));

    // Transform revenue by therapist data
    const therapistRevenueMap = new Map();
    
    // Initialize the map with therapist data
    therapists.forEach(therapist => {
      const revenueData: { 
        therapistId: string; 
        therapistName: string; 
        [key: string]: number | string 
      } = {
        therapistId: therapist.id,
        therapistName: therapist.name
      };

      // Initialize all services with 0 revenue
      services.forEach(service => {
        revenueData[service.name] = 0;
      });

      // Calculate revenue for each service
      therapist.appointments.forEach(apt => {
        if (apt.service) {
          revenueData[apt.service.name] = Number(revenueData[apt.service.name]) + Number(apt.price || 0);
        }
      });

      therapistRevenueMap.set(therapist.id, revenueData);
    });

    // Format revenue by therapist data
    const formattedRevenueByTherapist = Array.from(therapistRevenueMap.values())
      .map(therapistData => {
        // Create a new object with only non-zero revenue services
        const filteredRevenueData: any = {
          therapistId: therapistData.therapistId,
          therapistName: therapistData.therapistName
        };
        
        // Add only services with non-zero revenue
        Object.entries(therapistData).forEach(([key, value]) => {
          if (key !== 'therapistId' && key !== 'therapistName' && typeof value === 'number' && value > 0) {
            filteredRevenueData[key] = value;
          }
        });
        
        return filteredRevenueData;
      })
      .filter(therapist => {
        // Only include therapists who have any revenue
        const totalRevenue = Object.values(therapist)
          .filter(value => typeof value === 'number')
          .reduce((sum, value) => sum + value, 0);
        return totalRevenue > 0;
      })
      .sort((a, b) => {
        // Sort by total revenue
        const totalA = Object.values(a)
          .filter(value => typeof value === 'number')
          .reduce((sum, value) => sum + value, 0);
        const totalB = Object.values(b)
          .filter(value => typeof value === 'number')
          .reduce((sum, value) => sum + value, 0);
        return totalB - totalA;
      });

    console.log('Therapist revenue data:', formattedRevenueByTherapist);

    // Format service distribution data
    const serviceDistribution = services.map(service => {
      const revenue = appointments
        .filter(apt => apt.service?.id === service.id)
        .reduce((sum, apt) => sum + (apt.price || 0), 0);
      const count = appointments.filter(apt => apt.service?.id === service.id).length;
      return {
        serviceId: service.id,
        serviceName: service.name,
        revenue,
        _count: count
      };
    }).filter(service => service.revenue > 0);

    // Calculate revenue trend with all data points
    const revenueTrend = groupAppointmentsByPeriod(appointments, start, end);

    console.log('Formatted revenue data:', {
      revenueByTherapist: formattedRevenueByTherapist,
      serviceDistribution,
      revenueTrend
    });

    // Get previous period data
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(end.getTime() - periodLength);

    const previousPeriodData = {
      totalRevenue: await prisma.appointment.aggregate({
        where: {
          startTime: {
            gte: previousStart,
            lte: previousEnd,
          },
          NOT: {
            status: {
              in: ['CANCELLED', 'NO_SHOW'] as Status[]
            }
          }
        },
        _sum: {
          price: true
        }
      }),
      totalAppointments: await prisma.appointment.count({
        where: {
          startTime: {
            gte: previousStart,
            lte: previousEnd,
          }
        }
      }),
      newClients: await prisma.client.count({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          }
        }
      })
    };

    return res.json({
      currentPeriod: {
        totalRevenue,
        totalAppointments,
        newClients,
        totalClients,
        revenueByService: revenueByService.map(rev => ({
          serviceId: rev.serviceId,
          serviceName: services.find(s => s.id === rev.serviceId)?.name,
          revenue: rev._sum.price || 0
        })),
        revenueByTherapist: formattedRevenueByTherapist,
        revenueTrend,
        serviceDistribution,
        services: services.map(s => ({
          id: s.id,
          name: s.name
        }))
      },
      previousPeriod: previousPeriodData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const getServiceAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user as any;

    if (!user || !user.email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const start = startOfDay(parseISO(startDate as string));
    const end = endOfDay(parseISO(endDate as string));

    // Get all services
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        appointments: {
          where: {
            startTime: {
              gte: start,
              lte: end,
            },
            NOT: {
              status: {
                in: ['CANCELLED', 'NO_SHOW'] as Status[]
              }
            }
          },
          include: {
            client: true,
            therapist: true,
            service: true
          }
        }
      }
    });

    // Calculate metrics for each service
    const serviceAnalytics = services.map(service => {
      const totalAppointments = service.appointments.length;
      const totalRevenue = service.appointments.reduce((sum, apt) => sum + (apt.price || service.price), 0);
      const uniqueClients = new Set(service.appointments.map(apt => apt.client.id)).size;
      const uniqueTherapists = new Set(service.appointments.map(apt => apt.therapist.id)).size;
      
      // Calculate average duration and price
      const avgPrice = totalAppointments > 0 ? totalRevenue / totalAppointments : service.price;

      // Group appointments by time period
      const monthlyData = groupAppointmentsByPeriod(service.appointments, start, end);

      return {
        id: service.id,
        name: service.name,
        metrics: {
          totalAppointments,
          totalRevenue,
          uniqueClients,
          uniqueTherapists,
          avgPrice,
          standardPrice: service.price,
          standardDuration: service.duration
        },
        monthlyTrends: monthlyData
      };
    });

    // Sort services by total revenue
    serviceAnalytics.sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);

    // Calculate overall statistics
    const overallStats = {
      totalRevenue: serviceAnalytics.reduce((sum, service) => sum + service.metrics.totalRevenue, 0),
      totalAppointments: serviceAnalytics.reduce((sum, service) => sum + service.metrics.totalAppointments, 0),
      uniqueClients: new Set(services.flatMap(s => s.appointments.map(a => a.client.id))).size,
      averageRevenuePerService: serviceAnalytics.reduce((sum, service) => sum + service.metrics.totalRevenue, 0) / serviceAnalytics.length,
      topPerformingServices: serviceAnalytics.slice(0, 5).map(s => ({
        name: s.name,
        revenue: s.metrics.totalRevenue,
        appointments: s.metrics.totalAppointments
      }))
    };

    res.json({
      services: serviceAnalytics,
      overallStats,
      dateRange: {
        start,
        end
      }
    });
  } catch (error) {
    console.error('Error in getServiceAnalytics:', error);
    res.status(500).json({ message: 'Failed to fetch service analytics', details: error.message });
  }
};

export const getTherapistAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get all appointments within the date range with their services and therapists
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: {
            in: ['CANCELLED', 'NO_SHOW'] as Status[]
          }
        }
      },
      include: {
        service: true,
        therapist: true,
        client: true,
      },
    });

    // Get all therapists
    const therapists = await prisma.therapist.findMany({
      include: {
        appointments: {
          where: {
            startTime: {
              gte: start,
              lte: end,
            },
            NOT: {
              status: {
                in: ['CANCELLED', 'NO_SHOW'] as Status[]
              }
            }
          },
          include: {
            service: true,
            client: true,
            therapist: true
          }
        }
      }
    });

    // Calculate metrics for each therapist
    const therapistMetrics = therapists.map(therapist => {
      const therapistAppointments = therapist.appointments;
      
      // Calculate total revenue
      const totalRevenue = therapistAppointments.reduce((sum, app) => {
        return sum + app.price;
      }, 0);

      // Calculate unique clients
      const uniqueClients = new Set(therapistAppointments.map(app => app.clientId)).size;

      // Calculate monthly trends
      const monthlyTrends = groupAppointmentsByPeriod(therapistAppointments, start, end);

      // Calculate occupancy rate (assuming 8-hour workday)
      const workingDays = differenceInDays(end, start) + 1;
      const totalAvailableHours = workingDays * 8;
      const totalBookedHours = therapistAppointments.reduce((sum, app) => {
        return sum + (app.service.duration / 60);
      }, 0);
      const occupancyRate = totalBookedHours / totalAvailableHours;

      return {
        id: therapist.id,
        name: therapist.name,
        metrics: {
          totalRevenue,
          totalAppointments: therapistAppointments.length,
          uniqueClients,
          averageRevenuePerAppointment: therapistAppointments.length > 0 
            ? totalRevenue / therapistAppointments.length 
            : 0,
          occupancyRate,
        },
        monthlyTrends,
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalRevenue: therapistMetrics.reduce((sum, t) => sum + t.metrics.totalRevenue, 0),
      totalAppointments: therapistMetrics.reduce((sum, t) => sum + t.metrics.totalAppointments, 0),
      uniqueClients: new Set(appointments.map(app => app.clientId)).size,
      averageRevenuePerTherapist: therapistMetrics.length > 0 
        ? therapistMetrics.reduce((sum, t) => sum + t.metrics.totalRevenue, 0) / therapistMetrics.length 
        : 0,
    };

    res.json({
      therapists: therapistMetrics,
      overallStats,
    });
  } catch (error) {
    console.error('Error fetching therapist analytics:', error);
    res.status(500).json({ error: 'Failed to fetch therapist analytics data' });
  }
};
