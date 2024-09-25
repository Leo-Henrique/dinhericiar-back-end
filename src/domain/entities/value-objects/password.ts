import { ValueObject } from "@/core/entities/value-object";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z.string().min(6).max(60);

export class Password extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue) {
    super();
  }
}
