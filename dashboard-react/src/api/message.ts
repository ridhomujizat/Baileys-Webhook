import api from './client';
import type { MessagePayload, ApiResponse } from '../types';

export const messageApi = {
    sendMessage: async (payload: MessagePayload) => {
        const response = await api.post<ApiResponse>('/message/send', payload);
        return response.data;
    },

    downloadMedia: async (payload: { sessionId: string; message: any; returnBase64?: boolean }) => {
        const response = await api.post<ApiResponse<{ buffer: string | { type: 'Buffer', data: number[] }; mimetype: string }>>(
            '/message/download-media',
            payload
        );
        return response.data;
    },
};
