import { z } from "zod";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";

export type SessionSchemaToCreate = z.infer<
  typeof SessionEntitySchema.toCreate
>;

export class SessionEntitySchema {
  static get toCreate() {
    return z.object({
      email: Email.schema,
      password: Password.schema,
    });
  }
}
