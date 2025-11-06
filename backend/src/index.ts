import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/searchRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', searchRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Travel Route Recommendation API',
    version: '1.0.0',
    endpoints: {
      search: 'POST /api/search',
      health: 'GET /api/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌍 Travel Route Recommendation API                      ║
║                                                            ║
║   Server running on: http://localhost:${PORT}              ║
║                                                            ║
║   Endpoints:                                               ║
║   • POST /api/search  - Search travel routes              ║
║   • GET  /api/health  - Health check                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
