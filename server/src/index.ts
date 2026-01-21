import express from 'express';
import cors from 'cors';
import gitRoutes from './routes/git';

const app = express();
const PORT = process.env.PORT || 3080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/git', gitRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔀  Gitty Server                                        ║
║                                                           ║
║   Server running at: http://localhost:${PORT}              ║
║   API endpoint:      http://localhost:${PORT}/api/git      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
