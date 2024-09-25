import { ValueObject } from "@/core/entities/value-object";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z.string().regex(/^[0-9a-fA-F]+$/);

export class Token extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue) {
    super();
  }
}
