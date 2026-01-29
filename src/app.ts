import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import sessionRoutes from './routes/session.routes';
import messageRoutes from './routes/message.routes';
import { sessionService } from './services/session.service';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Swagger Documentation (public)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Baileys API Documentation',
}));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
    }, 'Incoming request');
    next();
});

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// Start server
const startServer = async () => {
    // Restore existing sessions on startup
    await sessionService.restoreExistingSessions();

    app.listen(config.port, () => {
        logger.info({ port: config.port }, 'Server started');
        console.log(`\n🚀 Baileys HTTP Wrapper is running on http://localhost:${config.port}`);
        console.log(`📚 Swagger Documentation: http://localhost:${config.port}/api-docs`);
        console.log(`📝 Health Check: http://localhost:${config.port}/health\n`);
    });
};

startServer();

export default app;
