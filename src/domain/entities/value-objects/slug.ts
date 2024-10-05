import { ValueObject } from "@/core/entities/value-object";
import { z } from "zod";

type PrimitiveValue = z.infer<typeof schema>;

const schema = z.string();

export class Slug extends ValueObject<PrimitiveValue> {
  public static readonly schema = schema;

  public constructor(public readonly value: PrimitiveValue) {
    super();
  }

  public static createFromText(text: string) {
    const slugValue = text
      .normalize("NFKD")
      .replace(/[^\w\s]+|_+/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    return new Slug(slugValue);
  }
}
