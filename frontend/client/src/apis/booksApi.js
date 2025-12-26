import axiosInstance from './axiosConfig';

export const getAllBooks = async () => {
  try {
    const response = await axiosInstance.get('/books');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching books');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export const searchBooks = async (query) => {
  try {
    const response = await axiosInstance.get(`/books/search`, { params: { q: query } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error searching books');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

export const getBookById = async (id) => {
  try {
    const response = await axiosInstance.get(`/books/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching book by ID');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    throw error;
  }
};

export const createBook = async (bookData) => {
  try {
    const response = await axiosInstance.post('/books', bookData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creating book');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
};

export const updateBook = async (id, bookData) => {
  try {
    const response = await axiosInstance.put(`/books/${id}`, bookData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating book');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

export const deleteBook = async (id) => {
  try {
    const response = await axiosInstance.delete(`/books/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error deleting book');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

export const getBooksByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/books/category/${categoryId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error fetching books by category');
    }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching books by category:', error);
    throw error;
  }
};
