import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL?.trim().replace(/^["']|["']$/g, '');

const getRedisConnection = () => {
  if (redisUrl) {
    const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':***@');
    console.log(`[Redis] Connecting via REDIS_URL: ${maskedUrl}`);

    const options: RedisOptions = {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    };
    if (redisUrl.startsWith('rediss://')) {
      options.tls = {
        rejectUnauthorized: false,
      };
    }
    return new Redis(redisUrl, options);
  }

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  console.warn(`[Redis] WARNING: No REDIS_URL environment variable detected! Defaulting to ${redisHost}:${redisPort}`);

  return new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
  });
};

export const connection = getRedisConnection();

connection.on('connect', () => {
  console.log('[Redis] Successfully connected to Redis server!');
});

connection.on('ready', () => {
  console.log('[Redis] Redis client is ready to accept commands.');
});

connection.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});


