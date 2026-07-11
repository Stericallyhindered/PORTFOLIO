const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisConnection = {
  url: redisUrl,
};

