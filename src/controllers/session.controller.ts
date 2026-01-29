import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { ApiResponse } from '../types';

export const startSession = async (req: Request, res: Response) => {
    try {
        const { sessionId, phoneNumber } = req.body;

        if (!sessionId) {
            const response: ApiResponse = {
                success: false,
                error: 'sessionId is required',
            };
            return res.status(400).json(response);
        }

        const session = await sessionService.createSession(sessionId, phoneNumber);

        const response: ApiResponse = {
            success: true,
            message: 'Session started successfully',
            data: {
                sessionId,
                status: session.getStatus(),
                authMethod: phoneNumber ? 'pairing_code' : 'qr_code',
            },
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

export const getQRCode = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found',
            };
            return res.status(404).json(response);
        }

        const qr = session.getQRCode();
        const status = session.getStatus();

        if (!qr) {
            const response: ApiResponse = {
                success: false,
                error: `QR code not available. Current status: ${status}`,
                data: {
                    status,
                    message: status === 'connected'
                        ? 'Session is already connected. Use logout endpoint to disconnect first.'
                        : status === 'connecting'
                            ? 'Session is still initializing. Please wait a moment and try again.'
                            : 'Session is disconnected. Please start a new session.',
                },
            };
            return res.status(404).json(response);
        }

        const response: ApiResponse = {
            success: true,
            data: {
                qr,
                status,
            },
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

export const getStatus = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found',
            };
            return res.status(404).json(response);
        }

        const response: ApiResponse = {
            success: true,
            data: {
                sessionId,
                status: session.getStatus(),
                phone: session.getPhone(),
            },
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

export const logout = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found',
            };
            return res.status(404).json(response);
        }

        await session.logout();
        await sessionService.deleteSession(sessionId);

        const response: ApiResponse = {
            success: true,
            message: 'Logged out successfully',
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

export const getPairingCode = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = sessionService.getSession(sessionId);

        if (!session) {
            const response: ApiResponse = {
                success: false,
                error: 'Session not found',
            };
            return res.status(404).json(response);
        }

        const pairingCode = session.getPairingCode();
        const status = session.getStatus();

        if (!pairingCode) {
            const response: ApiResponse = {
                success: false,
                error: `Pairing code not available. Current status: ${status}`,
                data: {
                    status,
                    message: status === 'connected'
                        ? 'Session is already connected.'
                        : status === 'connecting'
                            ? 'Pairing code is being generated. Please wait a moment and try again.'
                            : 'Session is disconnected or using QR code authentication.',
                },
            };
            return res.status(404).json(response);
        }

        const response: ApiResponse = {
            success: true,
            data: {
                pairingCode,
                status,
                message: 'Enter this code in WhatsApp: Settings > Linked Devices > Link a Device > Link with phone number',
            },
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

export const getAllSessions = async (req: Request, res: Response) => {
    try {
        const sessions = sessionService.getAllSessions();

        const response: ApiResponse = {
            success: true,
            data: sessions,
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
