import { WhatsAppService } from './whatsapp.service';
import { SessionData } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import RedisService from './redis.service';

interface SessionConfig {
    webhookUrl?: string;
}

class SessionService {
    private sessions: Map<string, WhatsAppService> = new Map();
    private activeStatus: Map<string, boolean> = new Map();
    private webhookUrls: Map<string, string> = new Map();

    private async loadSessionConfig(sessionId: string): Promise<SessionConfig> {
        try {
            const configStr = await RedisService.getSessionData(sessionId, 'config');
            if (configStr) {
                return JSON.parse(configStr);
            }
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to load session config from Redis');
        }
        return {};
    }

    private async saveSessionConfig(sessionId: string, sessionConfig: SessionConfig): Promise<void> {
        try {
            await RedisService.setSessionData(sessionId, 'config', JSON.stringify(sessionConfig));
            logger.info({ sessionId }, 'Session config saved to Redis');
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to save session config to Redis');
        }
    }

    async createSession(sessionId: string, phoneNumber?: string): Promise<WhatsAppService> {
        if (this.sessions.has(sessionId)) {
            logger.warn({ sessionId }, 'Session already exists');
            return this.sessions.get(sessionId)!;
        }

        // Load existing config
        const sessionConfig = await this.loadSessionConfig(sessionId);
        if (sessionConfig.webhookUrl) {
            this.webhookUrls.set(sessionId, sessionConfig.webhookUrl);
        }

        const whatsappService = new WhatsAppService(sessionId);
        await whatsappService.initialize(phoneNumber);

        this.sessions.set(sessionId, whatsappService);
        this.activeStatus.set(sessionId, true); // Sessions are active by default
        logger.info({ sessionId, usePairingCode: !!phoneNumber }, 'Session created');

        return whatsappService;
    }

    getSession(sessionId: string): WhatsAppService | undefined {
        return this.sessions.get(sessionId);
    }

    async deleteSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);

        if (session) {
            await session.destroy();
            this.sessions.delete(sessionId);
            this.activeStatus.delete(sessionId);
            this.webhookUrls.delete(sessionId);
            logger.info({ sessionId }, 'Session deleted');
        }
    }

    getAllSessions(): SessionData[] {
        const sessions: SessionData[] = [];

        this.sessions.forEach((service, sessionId) => {
            sessions.push({
                sessionId,
                status: service.getStatus() as any,
                qr: service.getQRCode() || undefined,
                phone: service.getPhone() || undefined,
                isActive: this.activeStatus.get(sessionId) ?? true,
                webhookUrl: this.webhookUrls.get(sessionId) || undefined,
            });
        });

        return sessions;
    }

    hasSession(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    setSessionActive(sessionId: string, active: boolean): boolean {
        if (!this.sessions.has(sessionId)) {
            return false;
        }
        this.activeStatus.set(sessionId, active);
        logger.info({ sessionId, active }, 'Session active status changed');
        return true;
    }

    isSessionActive(sessionId: string): boolean {
        return this.activeStatus.get(sessionId) ?? true;
    }

    /**
     * Set webhook URL for a session
     */
    async setWebhookUrl(sessionId: string, webhookUrl: string): Promise<boolean> {
        if (!this.sessions.has(sessionId)) {
            return false;
        }

        // Update in memory
        if (webhookUrl) {
            this.webhookUrls.set(sessionId, webhookUrl);
        } else {
            this.webhookUrls.delete(sessionId);
        }

        // Persist to Redis
        const sessionConfig = await this.loadSessionConfig(sessionId);
        sessionConfig.webhookUrl = webhookUrl || undefined;
        await this.saveSessionConfig(sessionId, sessionConfig);

        logger.info({ sessionId, webhookUrl }, 'Session webhook URL updated');
        return true;
    }

    /**
     * Get webhook URL for a session
     * Falls back to global config.webhookUrl if not set
     */
    getWebhookUrl(sessionId: string): string | undefined {
        return this.webhookUrls.get(sessionId) || config.webhookUrl || undefined;
    }

    /**
     * Restore existing sessions from Redis on startup
     */
    async restoreExistingSessions(): Promise<void> {
        try {
            // Get all session keys from Redis
            const allKeys = await RedisService.getClient().keys('session:*:creds');
            const sessionIds = allKeys.map(key => key.split(':')[1]).filter((id, index, self) => self.indexOf(id) === index);

            logger.info({ count: sessionIds.length }, 'Found existing sessions to restore');

            for (const sessionId of sessionIds) {
                try {
                    // Check if creds exists in Redis
                    const credsStr = await RedisService.getSessionData(sessionId, 'creds');
                    if (credsStr) {
                        logger.info({ sessionId }, 'Restoring session...');
                        await this.createSession(sessionId);
                        logger.info({ sessionId }, 'Session restored successfully');
                    }
                } catch (error) {
                    logger.error({ error, sessionId }, 'Failed to restore session');
                }
            }
        } catch (error) {
            logger.error({ error }, 'Failed to restore sessions from Redis');
        }
    }
}

export const sessionService = new SessionService();

