export type UnitOfWorkSessionOptions<Session = unknown> = {
  session?: Session;
};

export abstract class UnitOfWork {
  abstract transaction<Result>(
    work: (session: unknown) => Promise<Result>,
  ): Promise<Result>;
}
