import axiosInstance from './axiosConfig';

export const getAllCategories = async () => {
  try {
    const response = await axiosInstance.get('/categories');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching categories');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const searchCategories = async (query) => {
  try {
    const response = await axiosInstance.get(`/categories/search`, { params: { q: query } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error searching categories');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching category by ID');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await axiosInstance.post('/categories', categoryData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating category');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, categoryData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating category');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await axiosInstance.delete(`/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting category');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};