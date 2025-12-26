import axios from 'axios';

// Tạo một instance của Axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3100/api', // Thay đổi URL này thành URL API của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để xử lý request
axiosInstance.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu cần
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung, ví dụ: thông báo lỗi, điều hướng đến trang login nếu lỗi 401
    if (error.response && error.response.status === 401) {
      // Xử lý lỗi 401
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 