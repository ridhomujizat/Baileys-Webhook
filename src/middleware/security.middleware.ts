import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/config';

/**
 * Helmet middleware for security headers
 * Protects against XSS, clickjacking, MIME sniffing, etc.
 */
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for React
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Allow loading resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Rate limiter to prevent brute force attacks
 * Default: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    },
});

/**
 * Stricter rate limiter for auth endpoints
 * 10 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: 10,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
    const methods = ['POST', 'PUT', 'PATCH'];
    
    if (methods.includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                success: false,
                error: 'Content-Type must be application/json',
            });
        }
    }
    
    next();
};

/**
 * Sanitize request body to prevent NoSQL injection
 * Removes keys starting with $ and contains .
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        const sanitized: any = {};
        for (const key of Object.keys(obj)) {
            // Reject keys that look like injection attempts
            if (key.startsWith('$') || key.includes('..')) {
                continue;
            }
            sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    next();
};

/**
 * Security headers for additional protection
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Prevent caching of authenticated responses
    if (req.headers.authorization) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    // Remove server header
    res.removeHeader('X-Powered-By');
    
    next();
};
