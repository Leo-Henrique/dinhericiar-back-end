import { UnitOfWork } from "@/domain/gateways/unit-of-work";

export class FakeUnitOfWork implements UnitOfWork {
  async transaction<Result>(
    work: (session: unknown) => Promise<Result>,
  ): Promise<Result> {
    return work(null);
  }
}
