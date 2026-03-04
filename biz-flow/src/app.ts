import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, etc.)
      if (!origin) return cb(null, true);

      // In development, allow any localhost/127.0.0.1
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return cb(null, true);
      }

      // Allow Vercel preview domains if you want
      if (origin.endsWith('.vercel.app')) {
        return cb(null, true);
      }

      const originsVar = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
      const allowed = originsVar.split(',').map((o) => o.trim());

      if (allowed.includes(origin)) {
        cb(null, true);
      } else {
        console.warn(`⚠️  CORS blocked for origin: ${origin}`);
        // Rejecting origin by passing false, avoiding throwing internal error
        cb(null, false);
      }
    },
    credentials: true,
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Chief of AI – biz-flow', ts: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
