import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module, Provider } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { redisClient } from "./redis/redis.service";
@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({ connection: redisClient }),
  ],
})
export class QueuesModule {}
