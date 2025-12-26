import axiosInstance from './axiosConfig';

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // 🔥 phải là 'file'

    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
