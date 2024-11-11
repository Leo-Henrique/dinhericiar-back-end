import { env } from "@/infra/env";
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { generateRandomRedisDatabase } from "test/integration/generate-random-redis-database";

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
