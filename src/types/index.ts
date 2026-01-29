export interface SessionData {
    sessionId: string;
    status: 'connecting' | 'connected' | 'disconnected';
    qr?: string;
    phone?: string;
    isActive?: boolean;
    webhookUrl?: string;
}

export interface TextMessage {
    type: 'text';
    to: string;
    text: string;
}

export interface ImageMessage {
    type: 'image';
    to: string;
    image: string; // URL or base64
    caption?: string;
}

export interface VideoMessage {
    type: 'video';
    to: string;
    video: string; // URL or base64
    caption?: string;
}

export interface AudioMessage {
    type: 'audio';
    to: string;
    audio: string; // URL or base64
    ptt?: boolean; // Push to talk (voice note)
}

export interface DocumentMessage {
    type: 'document';
    to: string;
    document: string; // URL or base64
    fileName: string;
    mimetype?: string;
}

export interface LocationMessage {
    type: 'location';
    to: string;
    latitude: number;
    longitude: number;
}

export interface ContactMessage {
    type: 'contact';
    to: string;
    contact: {
        displayName: string;
        vcard: string;
    };
}

export type MessagePayload =
    | TextMessage
    | ImageMessage
    | VideoMessage
    | AudioMessage
    | DocumentMessage
    | LocationMessage
    | ContactMessage;

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export interface IncomingMessage {
    sessionId: string;
    from: string;
    messageType: string;
    message: any;
    timestamp: number;
}
