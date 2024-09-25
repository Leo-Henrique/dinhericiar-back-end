import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "./domain-error";
import { Either, left, right } from "./either";
import { UseCase } from "./use-case";

class FakeError extends DomainError {
  public readonly error = "FakeError" as const;
  public readonly debug = null;

  constructor() {
    super("Fake error.");
  }
}

type FakeUseCaseInput = {
  isSuccess: boolean;
};

type FakeUseCaseOutput = Either<
  FakeError,
  {
    isSuccess: boolean;
  }
>;

class FakeUseCase extends UseCase<FakeUseCaseInput, FakeUseCaseOutput> {
  public constructor() {
    super();
  }

  protected async handle(input: FakeUseCaseInput) {
    if (!input.isSuccess) return left(new FakeError());

    return right(input);
  }
}

describe("[Core] Use Case", () => {
  let sut: FakeUseCase;

  beforeEach(() => {
    sut = new FakeUseCase();
  });

  it("should be able to call 'execute' method of use case", async () => {
    const fakeUseCaseExecuteSpy = vi.spyOn(sut, "execute");
    // @ts-expect-error method 'handle' is protected
    const fakeUseCaseHandleSpy = vi.spyOn(sut, "handle");

    const { isRight, result } = await sut.execute<"success">({
      isSuccess: true,
    });

    expect(isRight()).toBeTruthy();
    expect(result).toEqual({ isSuccess: true });
    expect(fakeUseCaseExecuteSpy).toHaveBeenCalledTimes(1);
    expect(fakeUseCaseHandleSpy).toHaveBeenCalledTimes(1);
    expect(fakeUseCaseExecuteSpy.mock.invocationCallOrder[0]).toBeLessThan(
      fakeUseCaseHandleSpy.mock.invocationCallOrder[0],
    );
  });

  it("should be able to call 'unsafeExecute' method of use case", async () => {
    const fakeUseCaseUnsafeExecuteSpy = vi.spyOn(sut, "unsafeExecute");
    // @ts-expect-error method 'handle' is protected
    const fakeUseCaseHandleSpy = vi.spyOn(sut, "handle");

    const result = await sut.unsafeExecute({ isSuccess: true });

    expect(result).toEqual({ isSuccess: true });
    expect(fakeUseCaseUnsafeExecuteSpy).toHaveBeenCalledTimes(1);
    expect(fakeUseCaseHandleSpy).toHaveBeenCalledTimes(1);
    expect(
      fakeUseCaseUnsafeExecuteSpy.mock.invocationCallOrder[0],
    ).toBeLessThan(fakeUseCaseHandleSpy.mock.invocationCallOrder[0]);
  });

  it("should be able to throw error on call 'unsafeExecute' if necessary", async () => {
    const result = sut.unsafeExecute({ isSuccess: false });

    await expect(result).rejects.toBeInstanceOf(FakeError);
  });
});
