import axios from 'axios';
import { getAuthHeader } from '../utils/authUtils';
import api from './api';

const BASE_URL = 'http://localhost:3000/api';

export interface AnalyticsParams {
  startDate: string;
  endDate: string;
  groupBy?: string;
  metrics?: string[];
  filter?: {
    type: string;
    value: string;
  };
}

export interface AnalyticsFilter {
  type: 'therapist' | 'service';
  value: string;
}

export interface AnalyticsData {
  currentPeriod: {
    totalRevenue: number;
    totalAppointments: number;
    newClients: number;
    totalClients: number;
    revenueByService: Array<{
      serviceId: string;
      _sum: { price: number };
    }>;
    revenueByTherapist: Array<{
      therapistId: string;
      therapistName: string;
      totalRevenue: number;
      services: Array<{
        serviceId: string;
        serviceName: string;
        revenue: number;
        count: number;
      }>;
      [key: string]: any; // For dynamic service revenue fields
    }>;
    revenueTrend: Array<{
      date: string;
      revenue: number;
      appointments: number;
    }>;
    serviceDistribution: Array<{
      serviceId: string;
      serviceName: string;
      _count: number;
    }>;
    servicesList: Array<{
      id: string;
      name: string;
    }>;
  };
  previousPeriod: {
    totalRevenue: { _sum: { price: number | null } };
    totalAppointments: number;
    newClients: number;
  };
}

export const analyticsService = {
  async getAnalytics(params: AnalyticsParams) {
    try {
      const response = await axios.get(`${BASE_URL}/analytics`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  async getRevenueMetrics(params: AnalyticsParams) {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/revenue`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      throw error;
    }
  },

  async getAppointmentMetrics(params: AnalyticsParams) {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/appointments`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment metrics:', error);
      throw error;
    }
  },

  async getClientMetrics(params: AnalyticsParams) {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/clients`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching client metrics:', error);
      throw error;
    }
  },

  async getServiceMetrics(params: AnalyticsParams) {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/services`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching service metrics:', error);
      throw error;
    }
  },

  async getFilteredAnalytics(timeframe: string, filter: { type: string; value: string } | null = null) {
    try {
      const params: AnalyticsParams = {
        startDate: getTimeframeStartDate(timeframe),
        endDate: new Date().toISOString(),
        filter: filter ? { type: filter.type, value: filter.value } : undefined
      };

      const response = await axios.get(`${BASE_URL}/analytics/filtered`, {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered analytics:', error);
      throw error;
    }
  },

  async fetchAnalytics(startDate: Date, endDate: Date, filter?: AnalyticsFilter): Promise<AnalyticsData> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (filter) {
        params.append('filter[type]', filter.type);
        params.append('filter[value]', filter.value);
      }

      const response = await api.get(`/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
};

function getTimeframeStartDate(timeframe: string): string {
  const now = new Date();
  switch (timeframe) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case 'thisWeek':
      now.setDate(now.getDate() - now.getDay());
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case 'thisMonth':
      now.setDate(1);
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case 'thisYear':
      now.setMonth(0, 1);
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    default:
      return new Date(now.setDate(now.getDate() - 30)).toISOString();
  }
}
