export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    error?: string;
    data: T;
}

export interface SessionData {
    sessionId: string;
    status: 'connecting' | 'qr_ready' | 'pairing_code_ready' | 'connected' | 'disconnected';
    qr?: string;
    phone?: string;
    isActive?: boolean;
    pairingCode?: string;
}

export interface MessagePayload {
    sessionId: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
    to: string;
    text?: string;
    image?: string;
    video?: string;
    audio?: string;
    document?: string;
    caption?: string;
    ptt?: boolean;
    fileName?: string;
    mimetype?: string;
    latitude?: number;
    longitude?: number;
    contact?: {
        displayName: string;
        vcard: string;
    };
}
