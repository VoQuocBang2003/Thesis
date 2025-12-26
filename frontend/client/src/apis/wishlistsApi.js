import axiosInstance from './axiosConfig';

export const getAllWishlists = async () => {
  try {
    const response = await axiosInstance.get('/wishlists');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching wishlists');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    throw error;
  }
};

export const getWishlistByUserId = async (userId) => {
  try {
    const response = await axiosInstance.get(`/wishlists/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wishlist by user ID:', error);
    throw error;
  }
};

export const addToWishlist = async (wishlistData) => {
  try {
    const response = await axiosInstance.post('/wishlists', wishlistData);
    if (!response.data.success) {
      return response.data;
    }
    return response.data.data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

export const removeFromWishlist = async (data) => {
  try {
    const response = await axiosInstance.post('/wishlists/delete', data );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error removing from wishlist');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};