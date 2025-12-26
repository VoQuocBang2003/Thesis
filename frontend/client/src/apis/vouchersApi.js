import axiosInstance from './axiosConfig';

export const getActiveVouchers = async () => {
  const res = await axiosInstance.get('/vouchers/active');
  return res.data.data;
};

export const getVoucherByCode = async (code) => {
  const res = await axiosInstance.get(`/vouchers/code/${code}`);
  return res.data.data;
};

export const validateVoucher = async (code, orderAmount, userId, cartItems = null) => {
  const res = await axiosInstance.post('/vouchers/validate', {
    code,
    orderAmount,
    userId,
    cartItems
  });
  return res.data.data;
};

export default {
  getActiveVouchers,
  getVoucherByCode,
  validateVoucher,
};

