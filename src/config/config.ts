import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Paths
    webhookUrl: process.env.WEBHOOK_URL || '',
    sessionPath: process.env.SESSION_PATH || path.join(__dirname, '../../sessions'),
    staticPath: process.env.STATIC_PATH || path.join(__dirname, '../../public'),

    // Auth
    apiToken: process.env.TOKEN || '',

    // CORS - comma-separated list of allowed origins
    allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:5173'],

    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
};
