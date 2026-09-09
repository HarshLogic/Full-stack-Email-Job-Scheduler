import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const getRedisConnection = () => {
  if (redisUrl) {
    const options: RedisOptions = {
      maxRetriesPerRequest: null,
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

  return new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
  });
};

export const connection = getRedisConnection();

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

