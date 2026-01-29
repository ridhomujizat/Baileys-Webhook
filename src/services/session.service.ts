import { WhatsAppService } from './whatsapp.service';
import { SessionData } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';

interface SessionConfig {
    webhookUrl?: string;
}

class SessionService {
    private sessions: Map<string, WhatsAppService> = new Map();
    private activeStatus: Map<string, boolean> = new Map();
    private webhookUrls: Map<string, string> = new Map();

    private getConfigPath(sessionId: string): string {
        return path.join(config.sessionPath, sessionId, 'config.json');
    }

    private loadSessionConfig(sessionId: string): SessionConfig {
        const configPath = this.getConfigPath(sessionId);
        try {
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to load session config');
        }
        return {};
    }

    private saveSessionConfig(sessionId: string, sessionConfig: SessionConfig): void {
        const configPath = this.getConfigPath(sessionId);
        try {
            const sessionDir = path.dirname(configPath);
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify(sessionConfig, null, 2));
            logger.info({ sessionId }, 'Session config saved');
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to save session config');
        }
    }

    async createSession(sessionId: string, phoneNumber?: string): Promise<WhatsAppService> {
        if (this.sessions.has(sessionId)) {
            logger.warn({ sessionId }, 'Session already exists');
            return this.sessions.get(sessionId)!;
        }

        // Load existing config
        const sessionConfig = this.loadSessionConfig(sessionId);
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
    setWebhookUrl(sessionId: string, webhookUrl: string): boolean {
        if (!this.sessions.has(sessionId)) {
            return false;
        }

        // Update in memory
        if (webhookUrl) {
            this.webhookUrls.set(sessionId, webhookUrl);
        } else {
            this.webhookUrls.delete(sessionId);
        }

        // Persist to file
        const sessionConfig = this.loadSessionConfig(sessionId);
        sessionConfig.webhookUrl = webhookUrl || undefined;
        this.saveSessionConfig(sessionId, sessionConfig);

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
     * Restore existing sessions from the sessions directory on startup
     */
    async restoreExistingSessions(): Promise<void> {
        const sessionsPath = config.sessionPath;

        if (!fs.existsSync(sessionsPath)) {
            logger.info('No sessions directory found, skipping restore');
            return;
        }

        const sessionDirs = fs.readdirSync(sessionsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        logger.info({ count: sessionDirs.length }, 'Found existing sessions to restore');

        for (const sessionId of sessionDirs) {
            try {
                // Check if credentials file exists
                const credsPath = path.join(sessionsPath, sessionId, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    logger.info({ sessionId }, 'Restoring session...');
                    await this.createSession(sessionId);
                    logger.info({ sessionId }, 'Session restored successfully');
                }
            } catch (error) {
                logger.error({ error, sessionId }, 'Failed to restore session');
            }
        }
    }
}

export const sessionService = new SessionService();

