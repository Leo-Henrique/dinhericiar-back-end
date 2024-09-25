import { Encryption } from "@/domain/gateways/cryptology/encryption";
import { faker } from "@faker-js/faker";

export class FakeEncryption implements Encryption {
  async encrypt(bytes: number): Promise<string> {
    return faker.string.hexadecimal({ length: bytes * 2, prefix: "" });
  }
}
