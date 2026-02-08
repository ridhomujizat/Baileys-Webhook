import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys';
import RedisService from './redis.service';
import { logger } from '../utils/logger';

export const useRedisAuthState = async (sessionId: string): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
    const redis = RedisService.getClient();

    // Load existing creds from Redis
    const loadCreds = async (): Promise<AuthenticationCreds> => {
        try {
            const credsStr = await RedisService.getSessionData(sessionId, 'creds');
            if (credsStr) {
                const parsed = JSON.parse(credsStr, BufferJSON.reviver);
                return parsed;
            }
        } catch (error) {
            logger.error({ error, sessionId }, 'Error loading creds from Redis');
        }
        // Return new auth creds if not found
        return initAuthCreds();
    };

    let creds: AuthenticationCreds = await loadCreds();

    // Save creds to Redis
    const saveCreds = async () => {
        try {
            if (state.creds) {
                await RedisService.setSessionData(sessionId, 'creds', JSON.stringify(state.creds, BufferJSON.replacer, 2));
            }
        } catch (error) {
            logger.error({ error, sessionId }, 'Error saving creds to Redis');
        }
    };

    const state: AuthenticationState = {
        creds,
        keys: {
            get: async (type: string, ids: string[]) => {
                const data: { [id: string]: any } = {};
                for (const id of ids) {
                    try {
                        const value = await RedisService.getSessionData(sessionId, `${type}-${id}`);
                        if (value) {
                            data[id] = JSON.parse(value, BufferJSON.reviver);
                        }
                    } catch (error) {
                        logger.error({ error, type, id }, 'Error getting key from Redis');
                    }
                }
                return data;
            },
            set: async (data: any) => {
                for (const category in data) {
                    for (const id in data[category]) {
                        const value = data[category][id];
                        try {
                            await RedisService.setSessionData(sessionId, `${category}-${id}`, JSON.stringify(value, BufferJSON.replacer, 2));
                        } catch (error) {
                            logger.error({ error, category, id }, 'Error setting key in Redis');
                        }
                    }
                }
            }
        }
    };

    return {
        state,
        saveCreds
    };
};
