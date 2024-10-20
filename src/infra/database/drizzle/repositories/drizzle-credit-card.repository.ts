import {
  CreditCard,
  CreditCardDataUpdateInput,
  CreditCardEntity,
} from "@/domain/entities/credit-card.entity";
import { User } from "@/domain/entities/user.entity";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import {
  DrizzleCreditCardData,
  drizzleCreditCardTable,
} from "../schemas/drizzle-credit-card.schema";

@Injectable()
export class DrizzleCreditCardRepository implements CreditCardRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(creditCard: CreditCard): Promise<void> {
    await this.drizzle.client
      .insert(drizzleCreditCardTable)
      .values(creditCard.getRawData());
  }

  async updateUnique(
    creditCard: CreditCard,
    data: CreditCardDataUpdateInput,
  ): Promise<void> {
    const updatedCreditCardFields = creditCard.update(data);

    await this.drizzle.client
      .update(drizzleCreditCardTable)
      .set(updatedCreditCardFields);
  }

  async deleteUnique(creditCard: CreditCard): Promise<void> {
    const query = sql`
      DELETE FROM 
        credit_cards
      WHERE
        id = ${creditCard.id.value}
    `;

    await this.drizzle.client.execute(query);
  }

  async findUniqueByNameFromUser(
    name: string,
    user: User,
  ): Promise<CreditCard | null> {
    const query = sql`
      SELECT
        credit_cards.*
      FROM
        credit_cards
      INNER JOIN
        bank_accounts 
      ON 
        bank_accounts.id = credit_cards.bank_account_id
      AND
        bank_accounts.user_id = ${user.id.value}
      WHERE
        credit_cards.name = ${name}
      LIMIT 1
    `;
    const [creditCardOnDatabase] =
      await this.drizzle.executeToGet<DrizzleCreditCardData>(query);

    if (!creditCardOnDatabase) return null;

    return CreditCardEntity.create(creditCardOnDatabase);
  }

  async findUniqueMainFromUser(user: User): Promise<CreditCard | null> {
    const query = sql`
      SELECT
        credit_cards.*
      FROM
        credit_cards
      INNER JOIN
        bank_accounts 
      ON 
        bank_accounts.id = credit_cards.bank_account_id
      AND
        bank_accounts.user_id = ${user.id.value}
      WHERE
        credit_cards.is_main_card = true
      LIMIT 1
    `;
    const [creditCardOnDatabase] =
      await this.drizzle.executeToGet<DrizzleCreditCardData>(query);

    if (!creditCardOnDatabase) return null;

    return CreditCardEntity.create(creditCardOnDatabase);
  }

  async findUniqueByIdFromUser(
    id: string,
    user: User,
  ): Promise<CreditCard | null> {
    const query = sql`
      SELECT
        credit_cards.*
      FROM
        credit_cards
      INNER JOIN
        bank_accounts 
      ON 
        bank_accounts.id = credit_cards.bank_account_id
      AND
        bank_accounts.user_id = ${user.id.value}
      WHERE
        credit_cards.id = ${id}
      LIMIT 1
    `;
    const [creditCardOnDatabase] =
      await this.drizzle.executeToGet<DrizzleCreditCardData>(query);

    if (!creditCardOnDatabase) return null;

    return CreditCardEntity.create(creditCardOnDatabase);
  }

  async findUniqueBySlugFromUser(
    slug: string,
    user: User,
  ): Promise<CreditCard | null> {
    const query = sql`
      SELECT
        credit_cards.*
      FROM
        credit_cards
      INNER JOIN
        bank_accounts 
      ON 
        bank_accounts.id = credit_cards.bank_account_id
      AND
        bank_accounts.user_id = ${user.id.value}
      WHERE
        credit_cards.slug = ${slug}
      LIMIT 1
    `;
    const [creditCardOnDatabase] =
      await this.drizzle.executeToGet<DrizzleCreditCardData>(query);

    if (!creditCardOnDatabase) return null;

    return CreditCardEntity.create(creditCardOnDatabase);
  }
}
