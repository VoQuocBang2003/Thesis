import axiosInstance from './axiosConfig';

export const getReviewsByProduct = async (bookId) => {
  try {
    const response = await axiosInstance.get(`/reviews/product/${bookId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching reviews');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const getReviewsByUser = async (userId) => {
  try {
    const response = await axiosInstance.get(`/reviews/user/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching user reviews');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

export const createReview = async (reviewData) => {
  try {
    const response = await axiosInstance.post('/reviews', reviewData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axiosInstance.put(`/reviews/${reviewId}`, reviewData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const getReviewableProducts = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/reviews/order/${orderId}/reviewable`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching reviewable products');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reviewable products:', error);
    throw error;
  }
};

export default {
  getReviewsByProduct,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
  getReviewableProducts,
};


