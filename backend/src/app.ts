import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health';
import emailRoutes from './routes/email';
import authRoutes from './routes/auth';
import slackRoutes from './routes/slack';
import { requireAuth } from './middleware/requireAuth';
import { serverAdapter } from './config/bullBoard';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow if matches allowedOrigins or ends with vercel.app
    if (
      allowedOrigins.some(allowed => origin === allowed || origin.replace(/\/$/, '') === allowed.replace(/\/$/, '')) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/emails', requireAuth, emailRoutes); // Protected route

// Bull Board UI
app.use('/admin/queues', serverAdapter.getRouter());


// Basic error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
