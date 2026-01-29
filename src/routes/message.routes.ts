import { Router } from 'express';
import { sendMessage } from '../controllers/message.controller';

const router = Router();

/**
 * @swagger
 * /api/message/send:
 *   post:
 *     summary: Send a message (supports all message types)
 *     tags: [Message]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/TextMessage'
 *               - $ref: '#/components/schemas/ImageMessage'
 *               - $ref: '#/components/schemas/VideoMessage'
 *               - $ref: '#/components/schemas/AudioMessage'
 *               - $ref: '#/components/schemas/DocumentMessage'
 *               - $ref: '#/components/schemas/LocationMessage'
 *               - $ref: '#/components/schemas/ContactMessage'
 *           examples:
 *             text:
 *               summary: Text message
 *               value:
 *                 sessionId: my-session
 *                 type: text
 *                 to: "628123456789"
 *                 text: Hello from Baileys!
 *             image:
 *               summary: Image message
 *               value:
 *                 sessionId: my-session
 *                 type: image
 *                 to: "628123456789"
 *                 image: https://picsum.photos/200
 *                 caption: Check this image!
 *             video:
 *               summary: Video message
 *               value:
 *                 sessionId: my-session
 *                 type: video
 *                 to: "628123456789"
 *                 video: https://example.com/video.mp4
 *                 caption: Watch this video!
 *             audio:
 *               summary: Audio message
 *               value:
 *                 sessionId: my-session
 *                 type: audio
 *                 to: "628123456789"
 *                 audio: https://example.com/audio.mp3
 *                 ptt: true
 *             document:
 *               summary: Document message
 *               value:
 *                 sessionId: my-session
 *                 type: document
 *                 to: "628123456789"
 *                 document: https://example.com/document.pdf
 *                 fileName: document.pdf
 *                 mimetype: application/pdf
 *             location:
 *               summary: Location message
 *               value:
 *                 sessionId: my-session
 *                 type: location
 *                 to: "628123456789"
 *                 latitude: -6.2088
 *                 longitude: 106.8456
 *             contact:
 *               summary: Contact message
 *               value:
 *                 sessionId: my-session
 *                 type: contact
 *                 to: "628123456789"
 *                 contact:
 *                   displayName: John Doe
 *                   vcard: "BEGIN:VCARD\\nVERSION:3.0\\nFN:John Doe\\nTEL;type=CELL;type=VOICE;waid=628123456789:+62 812-3456-789\\nEND:VCARD"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request (invalid message type or session not connected)
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.post('/send', sendMessage);

export default router;
