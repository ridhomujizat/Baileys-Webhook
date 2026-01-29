import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { ApiResponse, MessagePayload } from '../types';

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
