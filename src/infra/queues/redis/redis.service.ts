import { env } from "@/infra/env";
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

function generateRandomRedisDatabase(min = 0, max = 15) {
  const randomRedisDatabase = Math.floor(Math.random() * (max - min) + min);

  if (randomRedisDatabase === env.REDIS_DATABASE)
    return generateRandomRedisDatabase(min, max);

  return randomRedisDatabase;
}

export const redisClient = new Redis({
  password: env.REDIS_PASSWORD,
  host: env.REDIS_HOSTNAME,
  port: env.REDIS_PORT,
  db:
    env.NODE_ENV !== "test"
      ? env.REDIS_DATABASE
      : generateRandomRedisDatabase(),
  maxRetriesPerRequest: null,
});

@Injectable()
export class RedisService {
  public client = redisClient;
}
