import { z } from "zod";
import { Email } from "../value-objects/email";
import { Name } from "../value-objects/name";
import { Password } from "../value-objects/password";

export type UserSchemaToCreate = z.infer<typeof UserEntitySchema.toCreate>;

export type UserSchemaToUpdate = z.infer<typeof UserEntitySchema.toUpdate>;

export class UserEntitySchema {
  static get toCreate() {
    return z.object({
      email: Email.schema,
      password: Password.schema,
      name: Name.schema,
    });
  }

  static get toUpdate() {
    return this.toCreate.partial();
  }
}
