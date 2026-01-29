import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Baileys HTTP Wrapper API',
            version: '1.0.0',
            description: 'HTTP wrapper untuk Baileys WhatsApp library dengan dukungan lengkap untuk mengirim dan menerima semua jenis pesan WhatsApp',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        tags: [
            {
                name: 'Session',
                description: 'Session management endpoints',
            },
            {
                name: 'Message',
                description: 'Message sending endpoints',
            },
            {
                name: 'Health',
                description: 'Health check endpoint',
            },
        ],
        security: [
            {
                BearerAuth: [],
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'Token',
                    description: 'Enter your API token (from TOKEN env variable)',
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indicates if the request was successful',
                        },
                        message: {
                            type: 'string',
                            description: 'Response message',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                        error: {
                            type: 'string',
                            description: 'Error message if request failed',
                        },
                    },
                },
                SessionData: {
                    type: 'object',
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'Unique session identifier',
                        },
                        status: {
                            type: 'string',
                            enum: ['connecting', 'connected', 'disconnected'],
                            description: 'Current session status',
                        },
                        qr: {
                            type: 'string',
                            description: 'QR code in base64 format (only available when connecting)',
                        },
                        phone: {
                            type: 'string',
                            description: 'Connected phone number',
                        },
                    },
                },
                TextMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'text'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'Session ID to use for sending',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['text'],
                            description: 'Message type',
                        },
                        to: {
                            type: 'string',
                            description: 'Recipient phone number (international format without +)',
                            example: '628123456789',
                        },
                        text: {
                            type: 'string',
                            description: 'Message text',
                            example: 'Hello from Baileys!',
                        },
                    },
                },
                ImageMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'image'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'Session ID to use for sending',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['image'],
                            description: 'Message type',
                        },
                        to: {
                            type: 'string',
                            description: 'Recipient phone number',
                            example: '628123456789',
                        },
                        image: {
                            type: 'string',
                            description: 'Image URL or base64 string',
                            example: 'https://picsum.photos/200',
                        },
                        caption: {
                            type: 'string',
                            description: 'Optional image caption',
                            example: 'Check this image!',
                        },
                    },
                },
                VideoMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'video'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['video'],
                        },
                        to: {
                            type: 'string',
                            example: '628123456789',
                        },
                        video: {
                            type: 'string',
                            description: 'Video URL or base64 string',
                            example: 'https://example.com/video.mp4',
                        },
                        caption: {
                            type: 'string',
                            example: 'Watch this video!',
                        },
                    },
                },
                AudioMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'audio'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['audio'],
                        },
                        to: {
                            type: 'string',
                            example: '628123456789',
                        },
                        audio: {
                            type: 'string',
                            description: 'Audio URL or base64 string',
                            example: 'https://example.com/audio.mp3',
                        },
                        ptt: {
                            type: 'boolean',
                            description: 'Send as voice note (push to talk)',
                            example: true,
                        },
                    },
                },
                DocumentMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'document', 'fileName'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['document'],
                        },
                        to: {
                            type: 'string',
                            example: '628123456789',
                        },
                        document: {
                            type: 'string',
                            description: 'Document URL or base64 string',
                            example: 'https://example.com/document.pdf',
                        },
                        fileName: {
                            type: 'string',
                            description: 'File name with extension',
                            example: 'document.pdf',
                        },
                        mimetype: {
                            type: 'string',
                            description: 'MIME type of the document',
                            example: 'application/pdf',
                        },
                    },
                },
                LocationMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'latitude', 'longitude'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['location'],
                        },
                        to: {
                            type: 'string',
                            example: '628123456789',
                        },
                        latitude: {
                            type: 'number',
                            description: 'GPS latitude',
                            example: -6.2088,
                        },
                        longitude: {
                            type: 'number',
                            description: 'GPS longitude',
                            example: 106.8456,
                        },
                    },
                },
                ContactMessage: {
                    type: 'object',
                    required: ['sessionId', 'type', 'to', 'contact'],
                    properties: {
                        sessionId: {
                            type: 'string',
                            example: 'my-session',
                        },
                        type: {
                            type: 'string',
                            enum: ['contact'],
                        },
                        to: {
                            type: 'string',
                            example: '628123456789',
                        },
                        contact: {
                            type: 'object',
                            required: ['displayName', 'vcard'],
                            properties: {
                                displayName: {
                                    type: 'string',
                                    example: 'John Doe',
                                },
                                vcard: {
                                    type: 'string',
                                    description: 'vCard format contact information',
                                    example: 'BEGIN:VCARD\\nVERSION:3.0\\nFN:John Doe\\nTEL;type=CELL;type=VOICE;waid=628123456789:+62 812-3456-789\\nEND:VCARD',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
