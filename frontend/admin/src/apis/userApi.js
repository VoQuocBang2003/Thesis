import axiosInstance from './axiosConfig';

export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get('/user');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching users');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/user/profile');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching user profile');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const searchUserByEmail = async (email) => {
  try {
    const response = await axiosInstance.get(`/user/searchByEmail`, { params: { email } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error searching user by email');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error searching user by email:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/user', userData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating user');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axiosInstance.put(`/user/${id}`, userData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating user');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/user/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting user');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
