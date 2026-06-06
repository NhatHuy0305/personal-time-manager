// Sửa dòng này: Import instance 'api' mình đã cấu hình interceptor
import api from './axios'; 

export const taskApi = {
    // Lấy dữ liệu ma trận
    getEisenhowerMatrix: () => {
        // Dùng api thay vì axios. 
        // Vì api đã có baseURL là .../api nên chỉ cần viết tiếp đuôi /tasks/eisenhower
        return api.get('/tasks/eisenhower');
    },
    
    // Tạo Task mới
    createTask: (taskData) => {
        // Tương tự, dùng api để tự động đính kèm Token
        return api.post('/tasks', taskData);
    },

    // Bạn có thể thêm các hàm khác tương tự
    getAllTasks: (params) => {
        return api.get('/tasks', { params });
    }
};