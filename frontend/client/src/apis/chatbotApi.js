import axiosInstance from './axiosConfig';

export const getChatbotRecommendation = async (message, preferences = {}) => {
  try {
    const response = await axiosInstance.post('/chatbot/recommend', {
      message,
      preferences
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error getting chatbot recommendation');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error getting chatbot recommendation:', error);
    throw error;
  }
};

export const getChatbotCategories = async () => {
  try {
    const response = await axiosInstance.get('/chatbot/categories');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error getting chatbot categories');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error getting chatbot categories:', error);
    throw error;
  }
};

