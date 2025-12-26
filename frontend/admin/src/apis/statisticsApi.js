import axiosInstance from './axiosConfig';

export const getDashboardStats = async () => {
  const res = await axiosInstance.get('/statistics/dashboard');
  return res.data.data;
};

export const getRevenueByDateRange = async (startDate, endDate) => {
  const res = await axiosInstance.get('/statistics/revenue/date-range', {
    params: { startDate, endDate }
  });
  return res.data.data;
};

export const getRevenueByProduct = async (startDate, endDate) => {
  const res = await axiosInstance.get('/statistics/revenue/product', {
    params: { startDate, endDate }
  });
  return res.data.data;
};

export const getRevenueReport = async (startDate, endDate, groupBy = 'day') => {
  const res = await axiosInstance.get('/statistics/revenue/report', {
    params: { startDate, endDate, groupBy }
  });
  return res.data.data;
};

export const compareRevenue = async (startDate, endDate, groupBy = 'day') => {
  const res = await axiosInstance.get('/statistics/revenue/compare', {
    params: { startDate, endDate, groupBy }
  });
  return res.data.data;
};

export default {
  getDashboardStats,
  getRevenueByDateRange,
  getRevenueByProduct,
  getRevenueReport,
  compareRevenue,
};

