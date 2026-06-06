import api from './axios';

export const habitApi = {
    // Lấy danh sách habit của user hiện tại
    getAllHabits: async () => {
        return await api.get('/habits');
    },

    // Lấy chi tiết một habit
    getHabitById: async (id) => {
        return await api.get(`/habits/${id}`);
    },

    // Lấy toàn bộ logs (lịch sử check-in) của một habit
    getHabitLogs: async (id) => {
        return await api.get(`/habits/${id}/logs`);
    },

    // Tạo mới một habit
    createHabit: async (data) => {
        return await api.post('/habits', data);
    },

    // Cập nhật thông tin habit
    updateHabit: async (id, data) => {
        return await api.put(`/habits/${id}`, data);
    },

    // Xóa một habit
    deleteHabit: async (id) => {
        return await api.delete(`/habits/${id}`);
    },

    // Toggle check-in (Đánh dấu / Hủy đánh dấu) trong 1 ngày
    checkIn: async (id, dateStr) => {
        return await api.post(`/habits/${id}/checkin`, null, {
            params: { date: dateStr }
        });
    }
};
