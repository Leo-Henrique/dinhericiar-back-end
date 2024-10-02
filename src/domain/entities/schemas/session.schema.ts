import { z } from "zod";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { Token } from "../value-objects/token";

export type SessionSchemaToCreate = z.infer<
  typeof SessionEntitySchema.toCreate
>;

export type SessionSchemaToGet = z.infer<typeof SessionEntitySchema.toGet>;

export class SessionEntitySchema {
  static get toCreate() {
    return z.object({
      email: Email.schema,
      password: Password.schema,
    });
  }

  static get toGet() {
    return z.object({
      token: Token.schema,
    });
  }
}
