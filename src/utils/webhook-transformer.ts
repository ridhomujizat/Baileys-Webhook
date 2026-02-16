import { proto, getContentType } from '@whiskeysockets/baileys';
import { SimplifiedWebhookPayload, WebhookMessageContent } from '../types';

/**
 * Message type mapping from Baileys proto types to simplified types
 */
const MESSAGE_TYPE_MAP: Record<string, SimplifiedWebhookPayload['messageType']> = {
    conversation: 'text',
    extendedTextMessage: 'text',
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    documentMessage: 'document',
    locationMessage: 'location',
    contactMessage: 'contact',
    contactsArrayMessage: 'contact',
    stickerMessage: 'sticker',
};

/**
 * Clean phone number by removing WhatsApp suffix
 * @param jid - WhatsApp JID (e.g., "628123456789@s.whatsapp.net")
 * @returns Clean phone number (e.g., "628123456789")
 */
export function cleanPhoneNumber(jid: string | null | undefined): string {
    if (!jid) return '';
    return jid.replace(/@s\.whatsapp\.net|@g\.us/g, '');
}

/**
 * Check if the chat is a group chat
 * @param jid - WhatsApp JID
 * @returns true if group chat, false otherwise
 */
export function isGroupChat(jid: string | null | undefined): boolean {
    if (!jid) return false;
    return jid.endsWith('@g.us');
}

/**
 * Extract message type from Baileys message
 * @param message - Baileys proto message
 * @returns Simplified message type
 */
export function extractMessageType(message: proto.IMessage): SimplifiedWebhookPayload['messageType'] {
    const contentType = getContentType(message);
    if (!contentType) return 'unknown';
    return MESSAGE_TYPE_MAP[contentType] || 'unknown';
}

/**
 * Extract text content from message
 * @param message - Baileys proto message
 * @returns Text content or undefined
 */
export function extractTextContent(message: proto.IMessage): string | undefined {
    if (message.conversation) {
        return message.conversation;
    }
    if (message.extendedTextMessage?.text) {
        return message.extendedTextMessage.text;
    }
    return undefined;
}

/**
 * Extract quoted/reply message context
 * @param message - Baileys proto message
 * @returns Quoted message info or undefined
 */
export function extractQuotedMessage(message: proto.IMessage): SimplifiedWebhookPayload['quotedMessage'] {
    // Check for contextInfo in various message types
    let contextInfo: proto.IContextInfo | null | undefined;

    if (message.extendedTextMessage?.contextInfo) {
        contextInfo = message.extendedTextMessage.contextInfo;
    } else if (message.imageMessage?.contextInfo) {
        contextInfo = message.imageMessage.contextInfo;
    } else if (message.videoMessage?.contextInfo) {
        contextInfo = message.videoMessage.contextInfo;
    } else if (message.audioMessage?.contextInfo) {
        contextInfo = message.audioMessage.contextInfo;
    } else if (message.documentMessage?.contextInfo) {
        contextInfo = message.documentMessage.contextInfo;
    } else if (message.locationMessage?.contextInfo) {
        contextInfo = message.locationMessage.contextInfo;
    } else if (message.contactMessage?.contextInfo) {
        contextInfo = message.contactMessage.contextInfo;
    } else if (message.stickerMessage?.contextInfo) {
        contextInfo = message.stickerMessage.contextInfo;
    }

    if (!contextInfo?.stanzaId) {
        return undefined;
    }

    // Extract text preview from quoted message if available
    let quotedText: string | undefined;
    if (contextInfo.quotedMessage?.conversation) {
        quotedText = contextInfo.quotedMessage.conversation;
    } else if (contextInfo.quotedMessage?.extendedTextMessage?.text) {
        quotedText = contextInfo.quotedMessage.extendedTextMessage.text;
    } else if (contextInfo.quotedMessage?.imageMessage?.caption) {
        quotedText = contextInfo.quotedMessage.imageMessage.caption;
    } else if (contextInfo.quotedMessage?.videoMessage?.caption) {
        quotedText = contextInfo.quotedMessage.videoMessage.caption;
    }

    return {
        messageId: contextInfo.stanzaId,
        text: quotedText,
    };
}

/**
 * Extract media content (image, video, audio, document, sticker)
 * @param message - Baileys proto message
 * @param type - Media type
 * @param sessionId - Session ID for download instructions
 * @param messageId - Message ID for download instructions
 * @returns Media content object
 */
export function extractMediaContent(
    message: proto.IMessage,
    type: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    sessionId: string,
    messageId: string
): WebhookMessageContent {
    let caption: string | undefined;
    let mimetype: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let duration: number | undefined;

    switch (type) {
        case 'image':
            if (message.imageMessage) {
                caption = message.imageMessage.caption || undefined;
                mimetype = message.imageMessage.mimetype || 'image/jpeg';
                fileSize = message.imageMessage.fileLength
                    ? Number(message.imageMessage.fileLength)
                    : undefined;
            }
            break;
        case 'video':
            if (message.videoMessage) {
                caption = message.videoMessage.caption || undefined;
                mimetype = message.videoMessage.mimetype || 'video/mp4';
                fileSize = message.videoMessage.fileLength
                    ? Number(message.videoMessage.fileLength)
                    : undefined;
                duration = message.videoMessage.seconds || undefined;
            }
            break;
        case 'audio':
            if (message.audioMessage) {
                mimetype = message.audioMessage.mimetype || 'audio/ogg';
                fileSize = message.audioMessage.fileLength
                    ? Number(message.audioMessage.fileLength)
                    : undefined;
                duration = message.audioMessage.seconds || undefined;
            }
            break;
        case 'document':
            if (message.documentMessage) {
                caption = message.documentMessage.caption || undefined;
                mimetype = message.documentMessage.mimetype || 'application/octet-stream';
                fileName = message.documentMessage.fileName || undefined;
                fileSize = message.documentMessage.fileLength
                    ? Number(message.documentMessage.fileLength)
                    : undefined;
            }
            break;
        case 'sticker':
            if (message.stickerMessage) {
                mimetype = message.stickerMessage.mimetype || 'image/webp';
                fileSize = message.stickerMessage.fileLength
                    ? Number(message.stickerMessage.fileLength)
                    : undefined;
            }
            break;
    }

    return {
        type,
        caption,
        mimetype,
        fileName,
        fileSize,
        duration,
        downloadInstructions: {
            method: 'POST',
            endpoint: '/api/message/download-media',
            body: {
                sessionId,
                messageId,
            },
        },
    };
}

/**
 * Extract location content
 * @param message - Baileys proto message
 * @returns Location content object
 */
export function extractLocationContent(message: proto.IMessage): WebhookMessageContent {
    const loc = message.locationMessage;
    return {
        type: 'location',
        latitude: loc?.degreesLatitude || 0,
        longitude: loc?.degreesLongitude || 0,
        name: loc?.name || undefined,
        address: loc?.address || undefined,
    };
}

/**
 * Extract contact content
 * @param message - Baileys proto message
 * @returns Contact content object
 */
export function extractContactContent(message: proto.IMessage): WebhookMessageContent {
    const contact = message.contactMessage;
    const contactsArray = message.contactsArrayMessage;

    // Handle single contact
    if (contact) {
        // Try to extract phone numbers from vcard
        const phones = extractPhonesFromVcard(contact.vcard || '');

        return {
            type: 'contact',
            displayName: contact.displayName || 'Unknown',
            vcard: contact.vcard || '',
            phones,
        };
    }

    // Handle contacts array (just return first contact for simplicity)
    if (contactsArray?.contacts && contactsArray.contacts.length > 0) {
        const firstContact = contactsArray.contacts[0];
        const phones = extractPhonesFromVcard(firstContact.vcard || '');

        return {
            type: 'contact',
            displayName: firstContact.displayName || 'Unknown',
            vcard: firstContact.vcard || '',
            phones,
        };
    }

    return {
        type: 'contact',
        displayName: 'Unknown',
        vcard: '',
    };
}

/**
 * Extract phone numbers from vcard string
 * @param vcard - vCard string
 * @returns Array of phone numbers
 */
function extractPhonesFromVcard(vcard: string): string[] | undefined {
    const phones: string[] = [];
    const lines = vcard.split('\n');

    for (const line of lines) {
        if (line.startsWith('TEL') || line.startsWith('tel')) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                phones.push(parts[1].trim());
            }
        }
    }

    return phones.length > 0 ? phones : undefined;
}

/**
 * Transform Baileys message to simplified webhook payload
 * @param msg - Baileys WebMessageInfo
 * @param sessionId - Session ID
 * @returns Simplified webhook payload
 */
export function transformToSimplifiedPayload(
    msg: proto.IWebMessageInfo,
    sessionId: string
): SimplifiedWebhookPayload {
    const message = msg.message!;
    const messageType = extractMessageType(message);
    const chatId = msg.key.remoteJid || '';
    const from = cleanPhoneNumber(msg.key.participant || msg.key.remoteJid);
    const messageId = msg.key.id || '';
    const timestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) : Date.now();

    // Extract push name (sender's name in WhatsApp)
    const fromName = msg.pushName || undefined;

    // Determine if group chat
    const isGroup = isGroupChat(chatId);

    // Extract participant for group messages
    const participant = isGroup && msg.key.participant
        ? cleanPhoneNumber(msg.key.participant)
        : undefined;

    // Extract quoted message if present
    const quotedMessage = extractQuotedMessage(message);

    // Extract content based on message type
    let content: WebhookMessageContent;

    switch (messageType) {
        case 'text': {
            const text = extractTextContent(message);
            content = {
                type: 'text',
                text: text || '',
            };
            break;
        }
        case 'image':
        case 'video':
        case 'audio':
        case 'document':
        case 'sticker':
            content = extractMediaContent(message, messageType, sessionId, messageId);
            break;
        case 'location':
            content = extractLocationContent(message);
            break;
        case 'contact':
            content = extractContactContent(message);
            break;
        default:
            content = {
                type: 'unknown',
                description: `Unsupported message type: ${getContentType(message)}`,
            };
    }

    return {
        sessionId,
        messageId,
        timestamp,
        from,
        fromName,
        messageType,
        isGroup,
        chatId,
        participant,
        content,
        quotedMessage,
    };
}
