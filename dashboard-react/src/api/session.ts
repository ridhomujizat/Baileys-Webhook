import api from './client';
import type { SessionData, ApiResponse } from '../types/index';

export const sessionApi = {
    getAllSessions: async () => {
        const response = await api.get<ApiResponse<SessionData[]>>('/session/all');
        return response.data;
    },

    getSessionStatus: async (sessionId: string) => {
        const response = await api.get<ApiResponse<SessionData>>(`/session/status/${sessionId}`);
        return response.data;
    },

    getQRCode: async (sessionId: string) => {
        const response = await api.get<ApiResponse<{ qr: string }>>(`/session/qr/${sessionId}`);
        return response.data;
    },

    startSession: async (sessionId: string) => {
        const response = await api.post<ApiResponse<SessionData>>('/session/start', { sessionId });
        return response.data;
    },

    deleteSession: async (sessionId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/session/delete/${sessionId}`);
        return response.data;
    },

    logoutSession: async (sessionId: string) => {
        const response = await api.post<ApiResponse<void>>(`/session/logout/${sessionId}`);
        return response.data;
    },

    getPairingCode: async (sessionId: string) => {
        const response = await api.get<ApiResponse<{ pairingCode: string; status: string; message: string }>>(`/session/pairing-code/${sessionId}`);
        return response.data;
    },

    toggleActive: async (sessionId: string, active: boolean) => {
        const response = await api.patch<ApiResponse<{ sessionId: string; isActive: boolean }>>(`/session/${sessionId}/active`, { active });
        return response.data;
    },

    updateWebhookUrl: async (sessionId: string, webhookUrl: string) => {
        const response = await api.patch<ApiResponse<{ sessionId: string; webhookUrl: string | null }>>(`/session/${sessionId}/webhook`, { webhookUrl });
        return response.data;
    },
};

