import makeWASocket, {
    DisconnectReason,
    WASocket,
    proto,
    downloadMediaMessage,
    getContentType,
    fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import { EventEmitter } from 'events';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import {
    TextMessage,
    ImageMessage,
    VideoMessage,
    AudioMessage,
    DocumentMessage,
    LocationMessage,
    ContactMessage,
    IncomingMessage,
} from '../types';
import { useRedisAuthState } from './auth-state.service';
import RedisService from './redis.service';
import { transformToSimplifiedPayload } from '../utils/webhook-transformer';

export class WhatsAppService extends EventEmitter {
    private sock: WASocket | null = null;
    private qrCode: string | null = null;
    private pairingCode: string | null = null;
    private sessionId: string;
    private phoneNumber: string | null = null;
    private status: 'connecting' | 'qr_ready' | 'pairing_code_ready' | 'connected' | 'disconnected' = 'disconnected';

    constructor(sessionId: string) {
        super();
        this.sessionId = sessionId;
    }

    async initialize(phoneNumber?: string): Promise<void> {
        try {
            const { state, saveCreds } = await useRedisAuthState(this.sessionId);

            // Fetch the latest WhatsApp Web version to avoid connection issues
            let version: [number, number, number] | undefined;
            try {
                const { version: latestVersion } = await fetchLatestWaWebVersion({});
                version = latestVersion;
                logger.info({ sessionId: this.sessionId, version }, 'Fetched latest WA Web version');
            } catch (error) {
                logger.warn({ error, sessionId: this.sessionId }, 'Failed to fetch latest WA version, using default');
            }

            this.sock = makeWASocket({
                auth: state,
                logger: logger as any,
                version,
            });

            this.status = 'connecting';

            // If phone number is provided, request pairing code instead of QR
            if (phoneNumber && !state.creds.registered) {
                this.phoneNumber = phoneNumber;
                // Wait a bit for socket to be ready
                setTimeout(async () => {
                    try {
                        const code = await this.sock!.requestPairingCode(phoneNumber);
                        this.pairingCode = code;
                        this.status = 'pairing_code_ready';
                        this.emit('pairing_code', code);
                        logger.info({ sessionId: this.sessionId, code }, 'Pairing code generated');
                    } catch (error) {
                        logger.error({ error, sessionId: this.sessionId }, 'Failed to request pairing code');
                    }
                }, 3000);
            }

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.qrCode = await QRCode.toDataURL(qr);
                    this.status = 'qr_ready';
                    this.emit('qr', this.qrCode);
                    logger.info({ sessionId: this.sessionId, qrLength: this.qrCode.length }, 'QR Code generated and ready');
                }

                if (connection === 'close') {
                    const shouldReconnect =
                        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

                    logger.info(
                        { sessionId: this.sessionId, shouldReconnect },
                        'Connection closed'
                    );

                    if (shouldReconnect) {
                        await this.initialize();
                    } else {
                        this.status = 'disconnected';
                    }
                } else if (connection === 'open') {
                    this.status = 'connected';
                    this.qrCode = null;
                    logger.info({ sessionId: this.sessionId }, 'Connection opened');
                }
            });

            // Save credentials on update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle incoming messages
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    await this.handleIncomingMessage(msg);
                }
            });
        } catch (error) {
            logger.error({ error, sessionId: this.sessionId }, 'Failed to initialize WhatsApp');
            throw error;
        }
    }

    private async handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
        try {
            // Transform to simplified payload
            const simplifiedPayload = transformToSimplifiedPayload(msg, this.sessionId);

            logger.info({
                messageType: simplifiedPayload.messageType,
                from: simplifiedPayload.from,
                isGroup: simplifiedPayload.isGroup,
            }, 'Received message');

            // Cache the message for media download (24 hour TTL)
            if (msg.message && msg.key.id) {
                try {
                    await RedisService.cacheMessage(this.sessionId, msg.key.id, msg.message, 86400);
                } catch (error) {
                    logger.error({ error }, 'Failed to cache message');
                }
            }

            // Import sessionService dynamically to avoid circular dependency
            const { sessionService } = await import('./session.service');

            // Check if session is active before sending to webhook
            if (!sessionService.isSessionActive(this.sessionId)) {
                logger.info({ sessionId: this.sessionId }, 'Session is inactive, skipping webhook');
                return;
            }

            // Get webhook URL for this session (falls back to global config)
            const webhookUrl = sessionService.getWebhookUrl(this.sessionId);

            // Send to webhook if configured
            if (webhookUrl) {
                try {
                    await axios.post(webhookUrl, simplifiedPayload);
                    logger.info({
                        webhookUrl,
                        messageType: simplifiedPayload.messageType,
                        from: simplifiedPayload.from,
                    }, 'Simplified message sent to webhook');
                } catch (error) {
                    logger.error({ error, webhookUrl }, 'Failed to send message to webhook');
                }
            }
        } catch (error) {
            logger.error({ error }, 'Error handling incoming message');
        }
    }

    /**
     * Download media from a WhatsApp message
     * @param message The complete message object from the webhook
     * @returns Buffer containing the decrypted media
     */
    async downloadMedia(message: proto.IMessage): Promise<{ buffer: Buffer; mimetype: string }> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        // Create a minimal message info structure for downloadMediaMessage
        const msgInfo: proto.IWebMessageInfo = {
            key: { remoteJid: '', fromMe: false, id: '' },
            message: message,
        };

        const buffer = await downloadMediaMessage(
            msgInfo,
            'buffer',
            {},
            {
                logger: logger as any,
                reuploadRequest: this.sock.updateMediaMessage,
            }
        );

        // Get mimetype from the message
        const messageType = getContentType(message);
        let mimetype = 'application/octet-stream';

        if (messageType === 'imageMessage' && message.imageMessage) {
            mimetype = message.imageMessage.mimetype || 'image/jpeg';
        } else if (messageType === 'videoMessage' && message.videoMessage) {
            mimetype = message.videoMessage.mimetype || 'video/mp4';
        } else if (messageType === 'audioMessage' && message.audioMessage) {
            mimetype = message.audioMessage.mimetype || 'audio/ogg';
        } else if (messageType === 'documentMessage' && message.documentMessage) {
            mimetype = message.documentMessage.mimetype || 'application/octet-stream';
        } else if (messageType === 'stickerMessage' && message.stickerMessage) {
            mimetype = message.stickerMessage.mimetype || 'image/webp';
        }

        return { buffer: buffer as Buffer, mimetype };
    }

    async sendTextMessage(payload: TextMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const result = await this.sock.sendMessage(jid, { text: payload.text }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'text', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendImageMessage(payload: ImageMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const imageBuffer = await this.getMediaBuffer(payload.image);

        const result = await this.sock.sendMessage(jid, {
            image: imageBuffer,
            caption: payload.caption,
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'image', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendVideoMessage(payload: VideoMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const videoBuffer = await this.getMediaBuffer(payload.video);

        const result = await this.sock.sendMessage(jid, {
            video: videoBuffer,
            caption: payload.caption,
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'video', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendAudioMessage(payload: AudioMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const audioBuffer = await this.getMediaBuffer(payload.audio);

        const result = await this.sock.sendMessage(jid, {
            audio: audioBuffer,
            ptt: payload.ptt ?? false,
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'audio', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendDocumentMessage(payload: DocumentMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const documentBuffer = await this.getMediaBuffer(payload.document);

        const result = await this.sock.sendMessage(jid, {
            document: documentBuffer,
            fileName: payload.fileName,
            mimetype: payload.mimetype || 'application/octet-stream',
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'document', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendLocationMessage(payload: LocationMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);

        const result = await this.sock.sendMessage(jid, {
            location: {
                degreesLatitude: payload.latitude,
                degreesLongitude: payload.longitude,
            },
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'location', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    async sendContactMessage(payload: ContactMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);

        const result = await this.sock.sendMessage(jid, {
            contacts: {
                displayName: payload.contact.displayName,
                contacts: [{ vcard: payload.contact.vcard }],
            },
        }, {
            quoted: payload.replyTo ? {
                key: {
                    remoteJid: jid,
                    id: payload.replyTo,
                    participant: payload.participant,
                },
                message: {},
            } : undefined,
        });

        logger.info({ to: jid, type: 'contact', isReply: !!payload.replyTo }, 'Message sent');
        return result;
    }

    private formatJid(phone: string): string {
        // If already contains @, it's already formatted (group or user JID)
        if (phone.includes('@')) {
            return phone;
        }

        // Remove any non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Add @s.whatsapp.net for phone numbers
        return `${cleaned}@s.whatsapp.net`;
    }

    private async getMediaBuffer(media: string): Promise<Buffer> {
        // Check if it's a URL
        if (media.startsWith('http://') || media.startsWith('https://')) {
            const response = await axios.get(media, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        }

        // Check if it's base64
        if (media.startsWith('data:')) {
            const base64Data = media.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }

        // Assume it's already base64 without prefix
        return Buffer.from(media, 'base64');
    }

    getQRCode(): string | null {
        return this.qrCode;
    }

    getPairingCode(): string | null {
        return this.pairingCode;
    }

    getStatus(): string {
        return this.status;
    }

    getPhone(): string | null {
        return this.sock?.user?.id?.split(':')[0] || null;
    }

    async logout(): Promise<void> {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.status = 'disconnected';
            logger.info({ sessionId: this.sessionId }, 'Logged out');
        }
    }

    async destroy(): Promise<void> {
        if (this.sock) {
            this.sock.end(undefined);
            this.sock = null;
        }

        // Delete session data from Redis
        await RedisService.deleteAllSessionData(this.sessionId);
        logger.info({ sessionId: this.sessionId }, 'Session data deleted from Redis');
    }
}
