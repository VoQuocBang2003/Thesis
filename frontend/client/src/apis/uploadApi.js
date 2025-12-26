import axiosInstance from './axiosConfig';

export const uploadImage = async (formData) => {
  try {
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 