import api from './axios';

export const pomodoroApi = {
    // Lưu một phiên Pomodoro sau khi kết thúc/bị gián đoạn
    saveSession: async (data) => {
        return await api.post('/pomodoro/sessions', data);
    },

    // Lấy toàn bộ lịch sử phiên của user hiện tại
    getSessions: async () => {
        return await api.get('/pomodoro/sessions');
    },

    // Lấy thống kê: tổng phiên, tổng giờ, phiên hôm nay
    getStats: async () => {
        return await api.get('/pomodoro/stats');
    }
};
