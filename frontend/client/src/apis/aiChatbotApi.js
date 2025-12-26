import axiosInstance from './axiosConfig';

export const sendAIMessage = async (message, userId = 'default') => {
  try {
    const response = await axiosInstance.post('/ai-chatbot/chatbot/ai-chat', {
      message,
      userId
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error sending AI message');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error sending AI message:', error);
    throw error;
  }
};

export const getConversationContext = async (userId) => {
  try {
    const response = await axiosInstance.get(`/ai-chatbot/context/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error getting conversation context');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error getting conversation context:', error);
    throw error;
  }
};

export const clearConversationContext = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/ai-chatbot/context/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error clearing conversation context');
    }
    return response.data.message;
  } catch (error) {
    console.error('Error clearing conversation context:', error);
    throw error;
  }
};
