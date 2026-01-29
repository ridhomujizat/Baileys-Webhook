import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import sessionRoutes from './routes/session.routes';
import messageRoutes from './routes/message.routes';
import { sessionService } from './services/session.service';
import { authMiddleware } from './middleware/auth.middleware';
import {
    helmetMiddleware,
    apiRateLimiter,
    validateContentType,
    sanitizeInput,
    additionalSecurityHeaders,
} from './middleware/security.middleware';

const app = express();

// ===================
// Security Middleware
// ===================

// Helmet for security headers
app.use(helmetMiddleware);

// Additional security headers
app.use(additionalSecurityHeaders);

// CORS configuration
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // In production, check against allowed origins
        if (config.nodeEnv === 'production') {
            if (config.allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            // In development, allow all origins
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting for API
app.use('/api', apiRateLimiter);

// Body parsing with limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Input validation and sanitization
app.use(validateContentType);
app.use(sanitizeInput);

// ===================
// Static Files (Frontend)
// ===================

// Serve static files from public directory
app.use(express.static(config.staticPath, {
    etag: true,
    lastModified: true,
    maxAge: config.nodeEnv === 'production' ? '1d' : 0,
}));

// ===================
// API Routes
// ===================

// Swagger Documentation (public, but with CSP adjustments)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Baileys API Documentation',
}));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip logging for static files
    if (req.path.startsWith('/assets') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
        return next();
    }

    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
    }, 'Incoming request');
    next();
});

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
    });
});

// Apply auth middleware to all API routes
app.use('/api', authMiddleware);

// Token validation endpoint
app.get('/api/auth/check', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Token is valid'
    });
});

// Routes (protected by auth middleware)
app.use('/api/session', sessionRoutes);
app.use('/api/message', messageRoutes);

// ===================
// SPA Fallback
// ===================

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
        return next();
    }

    const indexPath = path.join(config.staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            // If index.html doesn't exist, continue to 404 handler
            next();
        }
    });
});

// ===================
// Error Handlers
// ===================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ error: err }, 'Unhandled error');

    // Don't expose error details in production
    const message = config.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';

    res.status(500).json({
        success: false,
        error: message,
    });
});

// ===================
// Server Startup
// ===================

const startServer = async () => {
    // Restore existing sessions on startup
    await sessionService.restoreExistingSessions();

    app.listen(config.port, () => {
        logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
        console.log(`\n🚀 Baileys HTTP Wrapper is running on http://localhost:${config.port}`);
        console.log(`📚 Swagger Documentation: http://localhost:${config.port}/api-docs`);
        console.log(`📝 Health Check: http://localhost:${config.port}/health`);
        console.log(`🌐 Dashboard: http://localhost:${config.port}/`);
        console.log(`🔒 Environment: ${config.nodeEnv}\n`);
    });
};

startServer();

export default app;

