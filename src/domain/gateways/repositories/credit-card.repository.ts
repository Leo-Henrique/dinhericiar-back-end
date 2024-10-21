import { PaginationParams } from "@/core/schemas/pagination-params";
import {
  CreditCard,
  CreditCardDataUpdateInput,
} from "@/domain/entities/credit-card.entity";
import { User } from "@/domain/entities/user.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class CreditCardRepository {
  abstract createUnique(creditCard: CreditCard): Promise<void>;
  abstract updateUnique(
    creditCard: CreditCard,
    data: CreditCardDataUpdateInput,
  ): Promise<void>;
  abstract deleteUnique(creditCard: CreditCard): Promise<void>;
  abstract findUniqueByNameFromUser(
    name: string,
    user: User,
  ): Promise<CreditCard | null>;
  abstract findUniqueMainFromUser(user: User): Promise<CreditCard | null>;
  abstract findUniqueByIdFromUser(
    id: string,
    user: User,
  ): Promise<CreditCard | null>;
  abstract findUniqueBySlugFromUser(
    id: string,
    user: User,
  ): Promise<CreditCard | null>;
  abstract findManyFromUser(
    user: User,
    options: PaginationParams & UnitOfWorkSessionOptions,
  ): Promise<CreditCard[]>;
  abstract countAllFromUser(
    user: User,
    options?: UnitOfWorkSessionOptions,
  ): Promise<number>;
}
