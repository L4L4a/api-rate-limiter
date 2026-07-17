import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

client.on('error', (err) => console.error('redis error:', err));

export async function connectRedis() {
  await client.connect();
  console.log('redis connected');
}

export default client;