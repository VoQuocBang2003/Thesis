import axiosInstance from './axiosConfig';

export const sendGamingMessage = async (message, userId, locale = 'vi') => {
  const res = await axiosInstance.post('/gaming-chatbot/chatbot', {
    message,
    userId,
    locale,
  });
  return res.data;
};

export const clearGamingConversationContext = async (userId) => {
  const res = await axiosInstance.delete(`/gaming-chatbot/context/${userId}`);
  return res.data;
};

export default {
  sendGamingMessage,
  clearGamingConversationContext,
};

