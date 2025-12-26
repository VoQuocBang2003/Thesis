import axiosInstance from './axiosConfig';

export const getAllReviews = async () => {
  try {
    const response = await axiosInstance.get('/reviews');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching reviews');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const approveReview = async (reviewId) => {
  try {
    const response = await axiosInstance.put(`/reviews/${reviewId}/approve`, { is_approved: true });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error approving review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error approving review:', error);
    throw error;
  }
};

export const rejectReview = async (reviewId) => {
  try {
    const response = await axiosInstance.put(`/reviews/${reviewId}/approve`, { is_approved: false });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error rejecting review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error rejecting review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    // Use admin route for admin panel
    const response = await axiosInstance.delete(`/reviews/${reviewId}/admin`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting review');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

