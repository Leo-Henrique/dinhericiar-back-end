import { z } from "zod";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { Token } from "../value-objects/token";

export type UserPasswordResetTokenSchemaToCreate = z.infer<
  typeof UserPasswordResetTokenEntitySchema.toCreate
>;

export type UserPasswordResetTokenSchemaToReset = z.infer<
  typeof UserPasswordResetTokenEntitySchema.toReset
>;

export class UserPasswordResetTokenEntitySchema {
  static get toCreate() {
    return z.object({
      email: Email.schema,
    });
  }

  static get toReset() {
    return z.object({
      token: Token.schema,
      password: Password.schema,
    });
  }
}
