import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis } from './redis';
import { rateLimiter } from './rateLimiter';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// health check — not rate limited
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// apply rate limiter to all routes below this line
app.use(rateLimiter);

// simulate a protected API endpoint
app.get('/api/data', (req, res) => {
  res.json({
    message: 'here is your data',
    timestamp: new Date().toISOString(),
  });
});

// simulate another protected endpoint
app.post('/api/action', (req, res) => {
  res.json({
    message: 'action completed',
    body: req.body,
  });
});

// show rate limit status for a given identifier
app.get('/status/:identifier', async (req, res) => {
  const redis = (await import('./redis')).default;
  const key = `rate:${req.params.identifier}`;
  const count = await redis.zCard(key);
  const MAX = parseInt(process.env.RATE_LIMIT_MAX || '10');

  res.json({
    identifier: req.params.identifier,
    requests: count,
    limit: MAX,
    remaining: Math.max(0, MAX - count),
  });
});

const PORT = process.env.PORT || 3001;

async function start() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`rate limiter running on port ${PORT}`);
  });
}

start();