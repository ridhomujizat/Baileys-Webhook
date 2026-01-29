import api from './client';

export const authApi = {
    checkToken: async () => {
        const response = await api.get<{ success: boolean; message: string }>('/auth/check');
        return response.data;
    },
};
