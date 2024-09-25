import {
  ExpectedResultOfEither,
  InferEither,
  InferRightResult,
} from "./@types/either";
import { Either, EitherReason, EitherResult } from "./either";

export abstract class UseCase<
  Input extends object | null,
  Output extends Either<EitherReason, EitherResult>,
> {
  protected abstract handle(input: Input): Promise<Output>;

  public async execute<Expected extends ExpectedResultOfEither>(input: Input) {
    return (await this.handle(input)) as InferEither<Output, Expected>;
  }

  public async unsafeExecute(input: Input) {
    const useCase = await this.handle(input);

    if (useCase.isLeft()) throw useCase.reason;

    return useCase.result as InferRightResult<Output>;
  }
}
