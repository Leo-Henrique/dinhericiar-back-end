import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";
import {
  DrizzleService,
  DrizzleTransactionClient,
} from "../database/drizzle/drizzle.service";

@Injectable()
export class InfraUnitOfWork implements UnitOfWork {
  public constructor(private readonly drizzle: DrizzleService) {}

  public async transaction<Result>(
    work: (session: DrizzleTransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.drizzle.client.transaction(work);
  }
}
