import Redis from 'ioredis';
import { logger } from '../utils/logger';

class RedisService {
    private static instance: RedisService;
    private client: Redis;

    private constructor() {
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USER || 'default',
            password: process.env.REDIS_PASS || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        };

        this.client = new Redis(config);

        this.client.on('connect', () => {
            logger.info('Redis connected');
        });

        this.client.on('error', (err) => {
            logger.error({ err }, 'Redis connection error');
        });

        this.client.on('reconnecting', () => {
            logger.info('Redis reconnecting');
        });
    }

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    public getClient(): Redis {
        return this.client;
    }

    // Session-specific methods
    public async setSessionData(sessionId: string, key: string, value: string): Promise<void> {
        await this.client.set(`session:${sessionId}:${key}`, value);
    }

    public async getSessionData(sessionId: string, key: string): Promise<string | null> {
        return await this.client.get(`session:${sessionId}:${key}`);
    }

    public async deleteSessionData(sessionId: string, key: string): Promise<void> {
        await this.client.del(`session:${sessionId}:${key}`);
    }

    public async getAllSessionKeys(sessionId: string): Promise<string[]> {
        return await this.client.keys(`session:${sessionId}:*`);
    }

    public async deleteAllSessionData(sessionId: string): Promise<void> {
        const keys = await this.getAllSessionKeys(sessionId);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

export default RedisService.getInstance();
