import { createClient } from 'redis';

const redisUrl = process.env.CACHE_REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          timeout: 10000,
        },
        pingInterval: 30000,
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });

      redisClient.on('ready', () => {
        console.log('Redis Client Ready');
      });

      redisClient.on('end', () => {
        console.log('Redis Client Disconnected');
      });

      await redisClient.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      throw err;
    }
  }
  return redisClient;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (err) {
    console.error('Error getting cache:', err);
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttlSeconds = 300) {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error('Error setting cache:', err);
  }
}


export async function deleteCache(key: string) {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (err) {
    console.error('Error deleting cache:', err);
  }
}

export async function clearCache(pattern?: string) {
  try {
    const client = await getRedisClient();
    if (!pattern) return;

    const stream = client.scanIterator({ MATCH: pattern, COUNT: 100 });
    const keys: string[] = [];

    for await (const key of stream) {
      keys.push(key as string);
      if (keys.length >= 100) {
        await client.del(keys);
        keys.length = 0;
      }
    }
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
}
