import axiosInstance from './axiosConfig';

export const getAllOrders = async () => {
  try {
    const response = await axiosInstance.get('/orders');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching orders');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await axiosInstance.get(`/orders/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching order by ID');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post('/orders', orderData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating order');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const response = await axiosInstance.put(`/orders/${id}`, orderData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating order');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(`/orders/status/${id}`, { status });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating order status');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await axiosInstance.delete(`/orders/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting order');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const searchOrders = async (query) => {
  try {
    const response = await axiosInstance.get(`/orders/search`, { params: { query: query } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error searching orders');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error searching orders:', error);
    throw error;
  }
};

export const getOrderByUserId = async (userId) => {
  try {
    const response = await axiosInstance.get(`/orders/user/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching orders by user ID');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders by user ID:', error);
    throw error;
  }
};

export const cancelOrder = async (id) => {
  try {
    const response = await axiosInstance.put(`/orders/cancel/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error canceling order');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
};