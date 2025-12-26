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
    const tokenStr = localStorage.getItem('token');
    if (tokenStr) {
      // Parse token nếu nó được lưu dưới dạng JSON string
      let token = tokenStr;
      try {
        token = JSON.parse(tokenStr);
      } catch (e) {
        // Nếu không phải JSON, dùng trực tiếp
        token = tokenStr;
      }
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
      // Xử lý lỗi 401 - xóa token và redirect về login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chỉ redirect nếu không phải đang ở trang login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 