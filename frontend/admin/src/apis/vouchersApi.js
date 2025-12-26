import axiosInstance from './axiosConfig';

export const getAllVouchers = async () => {
  const res = await axiosInstance.get('/vouchers');
  return res.data.data;
};

export const getActiveVouchers = async () => {
  const res = await axiosInstance.get('/vouchers/active');
  return res.data.data;
};

export const getVoucherByCode = async (code) => {
  const res = await axiosInstance.get(`/vouchers/code/${code}`);
  return res.data.data;
};

export const validateVoucher = async (code, orderAmount, userId) => {
  const res = await axiosInstance.post('/vouchers/validate', {
    code,
    orderAmount,
    userId
  });
  return res.data.data;
};

export const createVoucher = async (voucherData) => {
  const res = await axiosInstance.post('/vouchers', voucherData);
  return res.data.data;
};

export const updateVoucher = async (id, voucherData) => {
  const res = await axiosInstance.put(`/vouchers/${id}`, voucherData);
  return res.data.data;
};

export const deleteVoucher = async (id) => {
  const res = await axiosInstance.delete(`/vouchers/${id}`);
  return res.data;
};

export default {
  getAllVouchers,
  getActiveVouchers,
  getVoucherByCode,
  validateVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};

