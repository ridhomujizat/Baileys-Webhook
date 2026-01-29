import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    webhookUrl: process.env.WEBHOOK_URL || '',
    sessionPath: process.env.SESSION_PATH || path.join(__dirname, '../../sessions'),
    apiToken: process.env.TOKEN || '',
};
