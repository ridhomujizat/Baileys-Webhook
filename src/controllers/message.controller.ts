import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { ApiResponse, MessagePayload } from '../types';
import RedisService from '../services/redis.service';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { sessionId, ...messagePayload } = req.body as MessagePayload & { sessionId: string };

        if (!sessionId) {
            const response: ApiResponse = {
                success: false,
                error: 'sessionId is required',
            };
            return res.status(400).json(response);
        }

        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found. Please start a session first.',
            };
            return res.status(404).json(response);
        }

        if (session.getStatus() !== 'connected') {
            const response: ApiResponse = {
                success: false,
                error: 'Session is not connected. Please scan QR code first.',
            };
            return res.status(400).json(response);
        }

        let result;

        switch (messagePayload.type) {
            case 'text':
                result = await session.sendTextMessage(messagePayload);
                break;
            case 'image':
                result = await session.sendImageMessage(messagePayload);
                break;
            case 'video':
                result = await session.sendVideoMessage(messagePayload);
                break;
            case 'audio':
                result = await session.sendAudioMessage(messagePayload);
                break;
            case 'document':
                result = await session.sendDocumentMessage(messagePayload);
                break;
            case 'location':
                result = await session.sendLocationMessage(messagePayload);
                break;
            case 'contact':
                result = await session.sendContactMessage(messagePayload);
                break;
            default:
                const response: ApiResponse = {
                    success: false,
                    error: 'Invalid message type',
                };
                return res.status(400).json(response);
        }

        const response: ApiResponse = {
            success: true,
            message: 'Message sent successfully',
            data: result,
        };

        res.json(response);
    } catch (error: any) {
        const response: ApiResponse = {
            success: false,
            error: error.message,
        };
        res.status(500).json(response);
    }
};

/**
 * Download media from a WhatsApp message
 * POST body can contain either:
 * - { sessionId, messageId } - New simplified format (recommended)
 * - { sessionId, message } - Legacy format with full message object
 */
export const downloadMedia = async (req: Request, res: Response) => {
    try {
        const { sessionId, messageId, message, returnBase64 } = req.body;

        if (!sessionId) {
            const response: ApiResponse = {
                success: false,
                error: 'sessionId is required',
            };
            return res.status(400).json(response);
        }

        // Get the session
        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found. Please start a session first.',
            };
            return res.status(404).json(response);
        }

        if (session.getStatus() !== 'connected') {
            const response: ApiResponse = {
                success: false,
                error: 'Session is not connected.',
            };
            return res.status(400).json(response);
        }

        // Determine which format is being used
        let messageObject: any;

        if (messageId) {
            // New format: look up message from cache
            messageObject = await RedisService.getCachedMessage(sessionId, messageId);

            if (!messageObject) {
                const response: ApiResponse = {
                    success: false,
                    error: 'Message not found in cache. The message may have expired (cached for 24 hours).',
                };
                return res.status(404).json(response);
            }
        } else if (message) {
            // Legacy format: use provided message object
            messageObject = message;
        } else {
            const response: ApiResponse = {
                success: false,
                error: 'Either messageId or message object is required',
            };
            return res.status(400).json(response);
        }

        // Download the media
        const { buffer, mimetype } = await session.downloadMedia(messageObject);

        // Return as base64 JSON or binary stream
        if (returnBase64) {
            const response: ApiResponse = {
                success: true,
                data: {
                    mimetype,
                    base64: buffer.toString('base64'),
                    size: buffer.length,
                },
            };
            return res.json(response);
        }

        // Return as binary stream
        res.setHeader('Content-Type', mimetype);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error: any) {
        const response: ApiResponse = {
            success: false,
            error: error.message,
        };
        res.status(500).json(response);
    }
};
