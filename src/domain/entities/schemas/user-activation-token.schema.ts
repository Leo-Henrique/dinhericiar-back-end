import { z } from "zod";
import { UserActivationTokenEntity } from "../user-activation-token.entity";
import { Token } from "../value-objects/token";

export type UserActivationTokenSchemaToActivate = z.infer<
  typeof UserActivationTokenEntitySchema.toActivate
>;

export class UserActivationTokenEntitySchema {
  static get toActivate() {
    return z.object({
      token: Token.schema.length(UserActivationTokenEntity.tokenBytes * 2),
    });
  }
}
