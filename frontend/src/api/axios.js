import axios from 'axios';

// Khởi tạo một instance của axios
const api = axios.create({
    // Chỉ để đường dẫn tương đối là '/api'. 
    // KHÔNG dùng 'http://localhost/api' hay 'http://localhost:8080/api'
    baseURL: '/api', 
});

// Interceptor: Tự động nhét Token vào Header trước khi gửi request
api.interceptors.request.use(
    (config) => {
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

export default api;