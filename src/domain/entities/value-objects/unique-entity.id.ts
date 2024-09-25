import { ValueObject } from "@/core/entities/value-object";
import { randomUUID } from "crypto";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z.string().uuid();

export class UniqueEntityId extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue = randomUUID()) {
    super();
  }
}
