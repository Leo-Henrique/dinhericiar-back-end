import { User } from "@/domain/entities/user.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class UserRepository {
  abstract createUnique(
    user: User,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
  abstract findUniqueByEmail(email: string): Promise<User | null>;
}