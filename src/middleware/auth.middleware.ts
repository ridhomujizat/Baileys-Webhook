import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

/**
 * Middleware to authenticate API requests using Bearer token
 * Token is read from the TOKEN environment variable
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip auth if no token is configured
    if (!config.apiToken) {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Authorization header is required',
        });
    }

    // Support both "Bearer <token>" and just "<token>"
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    if (token !== config.apiToken) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API token',
        });
    }

    next();
};
