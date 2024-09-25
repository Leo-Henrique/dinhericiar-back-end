import { ValueObject } from "@/core/entities/value-object";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z
  .string()
  .max(255)
  .trim()
  .regex(/^[^\p{Emoji}!@#$%^&*()_+=[\]{};:"<>?|/\\`~]*$/u);

export class Name extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue) {
    super();
  }
}
