import { EntitySchema } from "@/core/entities/entity";
import { z } from "zod";
import { Email } from "../value-objects/email";
import { Name } from "../value-objects/name";
import { Password } from "../value-objects/password";

export class UserEntitySchema extends EntitySchema {
  get create() {
    return z.object({
      email: Email.schema,
      password: Password.schema,
      name: Name.schema,
    });
  }

  get update() {
    return this.create.partial();
  }
}
