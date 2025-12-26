import axiosInstance from './axiosConfig';

export const getAllNews = async () => {
  try {
    const response = await axiosInstance.get('/news');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching news');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const getNewsById = async (id) => {
  try {
    const response = await axiosInstance.get(`/news/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching news by ID');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    throw error;
  }
};

export const searchNews = async (query) => {
  try {
    const response = await axiosInstance.get(`/news/search`, { params: { q: query } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error searching news');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error searching news:', error);
    throw error;
  }
};

export const createNews = async (newsData) => {
  try {
    const response = await axiosInstance.post('/news', newsData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating news');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
};

export const updateNewsById = async (id, newsData) => {
  try {
    const response = await axiosInstance.put(`/news/${id}`, newsData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating news');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
};

export const deleteNewsById = async (id) => {
  try {
    const response = await axiosInstance.delete(`/news/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting news');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};

export const getNewsByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/news/category/${categoryId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching news by category');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching news by category:', error);
    throw error;
  }
};