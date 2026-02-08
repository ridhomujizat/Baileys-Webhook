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
    replyTo?: string; // Message ID to reply to
    participant?: string; // For group replies
}

export interface ImageMessage {
    type: 'image';
    to: string;
    image: string; // URL or base64
    caption?: string;
    replyTo?: string;
    participant?: string;
}

export interface VideoMessage {
    type: 'video';
    to: string;
    video: string; // URL or base64
    caption?: string;
    replyTo?: string;
    participant?: string;
}

export interface AudioMessage {
    type: 'audio';
    to: string;
    audio: string; // URL or base64
    ptt?: boolean; // Push to talk (voice note)
    replyTo?: string;
    participant?: string;
}

export interface DocumentMessage {
    type: 'document';
    to: string;
    document: string; // URL or base64
    fileName: string;
    mimetype?: string;
    replyTo?: string;
    participant?: string;
}

export interface LocationMessage {
    type: 'location';
    to: string;
    latitude: number;
    longitude: number;
    replyTo?: string;
    participant?: string;
}

export interface ContactMessage {
    type: 'contact';
    to: string;
    contact: {
        displayName: string;
        vcard: string;
    };
    replyTo?: string;
    participant?: string;
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
    key: {
        remoteJid: string;
        id: string;
        fromMe: boolean;
        participant?: string; // For group messages
    };
}
