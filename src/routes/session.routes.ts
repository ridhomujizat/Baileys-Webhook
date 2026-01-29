import { Router } from 'express';
import {
    startSession,
    getQRCode,
    getPairingCode,
    getStatus,
    logout,
    getAllSessions,
} from '../controllers/session.controller';

const router = Router();

/**
 * @swagger
 * /api/session/start:
 *   post:
 *     summary: Start a new WhatsApp session
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Unique identifier for the session
 *                 example: my-session
 *     responses:
 *       200:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessionId:
 *                           type: string
 *                         status:
 *                           type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/start', startSession);

/**
 * @swagger
 * /api/session/qr/{sessionId}:
 *   get:
 *     summary: Get QR code for session pairing
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         qr:
 *                           type: string
 *                           description: Base64 encoded QR code image
 *       404:
 *         description: Session not found or QR code not available
 */
router.get('/qr/:sessionId', getQRCode);

/**
 * @swagger
 * /api/session/pairing-code/{sessionId}:
 *   get:
 *     summary: Get pairing code for phone number-based authentication
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Pairing code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         pairingCode:
 *                           type: string
 *                           description: 8-digit pairing code
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *       404:
 *         description: Session not found or pairing code not available
 */
router.get('/pairing-code/:sessionId', getPairingCode);

/**
 * @swagger
 * /api/session/status/{sessionId}:
 *   get:
 *     summary: Get session connection status
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SessionData'
 *       404:
 *         description: Session not found
 */
router.get('/status/:sessionId', getStatus);

/**
 * @swagger
 * /api/session/logout/{sessionId}:
 *   post:
 *     summary: Logout and delete session
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Session not found
 */
router.post('/logout/:sessionId', logout);

/**
 * @swagger
 * /api/session/all:
 *   get:
 *     summary: Get all active sessions
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: List of all sessions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SessionData'
 */
router.get('/all', getAllSessions);

export default router;
