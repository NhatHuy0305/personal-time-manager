import axiosClient from './axios';

export const reportApi = {
    getSummary: (from, to) => {
        return axiosClient.get('/reports/summary', { params: { from, to } });
    }
};
