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

// ============================================
// Simplified Webhook Payload Types
// ============================================

/**
 * Simplified webhook payload sent to external webhook URLs
 * This provides a clean, predictable structure for all message types
 */
export interface SimplifiedWebhookPayload {
    // Session & Basic Info
    sessionId: string;
    messageId: string;
    timestamp: number;

    // Sender Info (clean phone numbers without @s.whatsapp.net)
    from: string;
    fromName?: string;

    // Message Type
    messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker'
        | 'order' | 'product' | 'unknown';

    // Chat Context
    isGroup: boolean;
    chatId: string;
    participant?: string; // For group messages

    // Content (type-specific)
    content: WebhookMessageContent;

    // Optional: reply/quoted message context
    quotedMessage?: {
        messageId: string;
        text?: string;
    };
}

/**
 * Union type for all possible message content types
 */
export type WebhookMessageContent =
    | TextContent
    | MediaContent
    | LocationContent
    | ContactContent
    | OrderContent
    | ProductContent
    | UnknownContent;

/**
 * Text message content
 */
export interface TextContent {
    type: 'text';
    text: string;
}

/**
 * Media message content (image, video, audio, document, sticker)
 */
export interface MediaContent {
    type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
    caption?: string;
    mimetype?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number; // For audio/video in seconds
    downloadInstructions: {
        method: 'POST';
        endpoint: string;
        body: {
            sessionId: string;
            messageId: string;
        };
    };
}

/**
 * Location message content
 */
export interface LocationContent {
    type: 'location';
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
}

/**
 * Contact message content
 */
export interface ContactContent {
    type: 'contact';
    displayName: string;
    vcard: string;
    phones?: string[];
}

/**
 * Order message content (WA Business catalog order)
 */
export interface OrderContent {
    type: 'order';
    orderId: string;
    orderTitle?: string;
    message?: string;
    itemCount?: number;
    status?: string;
    totalAmount?: number;      // in smallest currency unit (e.g. cents × 1000)
    totalCurrencyCode?: string;
    sellerJid?: string;
    token?: string;
    catalogType?: string;
}

/**
 * Product message content (WA Business catalog product share)
 */
export interface ProductContent {
    type: 'product';
    businessOwnerJid?: string;
    body?: string;
    footer?: string;
    product?: {
        productId?: string;
        title?: string;
        description?: string;
        currencyCode?: string;
        priceAmount?: number;   // in smallest currency unit (e.g. cents × 1000)
        retailerId?: string;
        url?: string;
    };
    catalog?: {
        title?: string;
        description?: string;
    };
}

/**
 * Unknown/unsupported message content
 */
export interface UnknownContent {
    type: 'unknown';
    description: string;
}
