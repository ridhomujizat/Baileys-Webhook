import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    proto,
    downloadMediaMessage,
    getContentType,
    fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import { EventEmitter } from 'events';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
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

export class WhatsAppService extends EventEmitter {
    private sock: WASocket | null = null;
    private qrCode: string | null = null;
    private pairingCode: string | null = null;
    private sessionId: string;
    private phoneNumber: string | null = null;
    private status: 'connecting' | 'qr_ready' | 'pairing_code_ready' | 'connected' | 'disconnected' = 'disconnected';
    private sessionPath: string;

    constructor(sessionId: string) {
        super();
        this.sessionId = sessionId;
        this.sessionPath = path.join(config.sessionPath, sessionId);
    }

    async initialize(phoneNumber?: string): Promise<void> {
        try {
            // Create session directory if not exists
            if (!fs.existsSync(this.sessionPath)) {
                fs.mkdirSync(this.sessionPath, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

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
            const messageType = getContentType(msg.message!);
            const from = msg.key.remoteJid!;

            const incomingMessage: IncomingMessage = {
                sessionId: this.sessionId,
                from,
                messageType: messageType || 'unknown',
                message: msg.message,
                timestamp: msg.messageTimestamp as number,
            };

            logger.info({ incomingMessage }, 'Received message');

            // Send to webhook if configured
            if (config.webhookUrl) {
                try {
                    await axios.post(config.webhookUrl, incomingMessage);
                    logger.info({ webhookUrl: config.webhookUrl }, 'Message sent to webhook');
                } catch (error) {
                    logger.error({ error }, 'Failed to send message to webhook');
                }
            }
        } catch (error) {
            logger.error({ error }, 'Error handling incoming message');
        }
    }

    async sendTextMessage(payload: TextMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const result = await this.sock.sendMessage(jid, { text: payload.text });

        logger.info({ to: jid, type: 'text' }, 'Message sent');
        return result;
    }

    async sendImageMessage(payload: ImageMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const imageBuffer = await this.getMediaBuffer(payload.image);

        const result = await this.sock.sendMessage(jid, {
            image: imageBuffer,
            caption: payload.caption,
        });

        logger.info({ to: jid, type: 'image' }, 'Message sent');
        return result;
    }

    async sendVideoMessage(payload: VideoMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const videoBuffer = await this.getMediaBuffer(payload.video);

        const result = await this.sock.sendMessage(jid, {
            video: videoBuffer,
            caption: payload.caption,
        });

        logger.info({ to: jid, type: 'video' }, 'Message sent');
        return result;
    }

    async sendAudioMessage(payload: AudioMessage): Promise<any> {
        if (!this.sock) throw new Error('WhatsApp not initialized');

        const jid = this.formatJid(payload.to);
        const audioBuffer = await this.getMediaBuffer(payload.audio);

        const result = await this.sock.sendMessage(jid, {
            audio: audioBuffer,
            ptt: payload.ptt ?? false,
        });

        logger.info({ to: jid, type: 'audio' }, 'Message sent');
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
        });

        logger.info({ to: jid, type: 'document' }, 'Message sent');
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
        });

        logger.info({ to: jid, type: 'location' }, 'Message sent');
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
        });

        logger.info({ to: jid, type: 'contact' }, 'Message sent');
        return result;
    }

    private formatJid(phone: string): string {
        // Remove any non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Add @s.whatsapp.net if not already present
        if (!cleaned.includes('@')) {
            return `${cleaned}@s.whatsapp.net`;
        }

        return cleaned;
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

        // Delete session files
        if (fs.existsSync(this.sessionPath)) {
            fs.rmSync(this.sessionPath, { recursive: true, force: true });
            logger.info({ sessionId: this.sessionId }, 'Session files deleted');
        }
    }
}
