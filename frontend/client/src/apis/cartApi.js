import axiosInstance from './axiosConfig';

export const getCartByUser = async (userId) => {
  const res = await axiosInstance.get(`/cart/${userId}`);
  return res.data.data;
};

export const addToCart = async (cartItem) => {
  const res = await axiosInstance.post('/cart', cartItem);
  return res.data.data;
};

export const updateCartItem = async (userId, bookId, quantity) => {
  const res = await axiosInstance.put('/cart', { user_id: userId, book_id: bookId, quantity });
  return res.data.data;
};

export const deleteCartItem = async (userId, bookId) => {
  const res = await axiosInstance.delete(`/cart/${userId}/${bookId}`);
  return res.data.data;
};

export const clearCart = async (userId) => {
  const res = await axiosInstance.delete(`/cart/${userId}`);
  return res.data.data;
};