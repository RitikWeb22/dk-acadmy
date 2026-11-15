import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REDIS_URI = process.env.REDIS_URL;

if (!REDIS_URI) {
  console.error('[Redis Test] Error: REDIS_URL not found in .env');
  process.exit(1);
}

console.log('[Redis Test] Connecting to Redis...');
const redis = new Redis(REDIS_URI, {
  connectTimeout: 8000,
  maxRetriesPerRequest: 2
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully!');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

async function runTest() {
  try {
    const pong = await redis.ping();
    console.log('[Redis] PING response:', pong);

    await redis.set('dk_academy:test_key', 'Hello Redis from DK Academy!', 'EX', 60);
    const val = await redis.get('dk_academy:test_key');
    console.log('[Redis] GET response:', val);

    await redis.del('dk_academy:test_key');
    console.log('[Redis] Test key cleaned up. Verification complete!');
  } catch (err) {
    console.error('[Redis] Test failed:', err);
  } finally {
    redis.disconnect();
  }
}

runTest();
