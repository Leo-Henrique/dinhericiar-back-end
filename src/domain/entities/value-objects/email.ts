import { ValueObject } from "@/core/entities/value-object";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z.string().email();

export class Email extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue) {
    super();
  }
}
