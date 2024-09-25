import { User } from "@/domain/entities/user.entity";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";

export class FakeUserRepository implements UserRepository {
  async createUnique(): Promise<void> {}

  async updateUnique(): Promise<void> {}

  async deleteUnique(): Promise<void> {}

  async findUniqueById(): Promise<User | null> {
    return null;
  }

  async findUniqueByEmail(): Promise<User | null> {
    return null;
  }
}
