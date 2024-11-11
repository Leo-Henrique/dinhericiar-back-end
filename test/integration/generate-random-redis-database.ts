import { env } from "@/infra/env";

export function generateRandomRedisDatabase(min = 0, max = 15) {
  const randomRedisDatabase = Math.floor(Math.random() * (max - min) + min);

  if (randomRedisDatabase === env.REDIS_DATABASE)
    return generateRandomRedisDatabase(min, max);

  return randomRedisDatabase;
}
