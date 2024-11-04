import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { TransactionRecurrenceFixedEntitySchema } from "./schemas/transaction-recurrence-fixed.schema";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionRecurrenceFixed = EntityInstance<
  TransactionRecurrenceFixedData,
  TransactionRecurrenceFixedEntity
>;

export type TransactionRecurrenceFixedData = {
  id: UniqueEntityId;
  period: "YEAR" | "MONTH" | "WEEK";
  interval: number;
  occurrences: number[] | null;
};

export type TransactionRecurrenceFixedDataCreateInput = SetRequired<
  EntityDataCreateInput<TransactionRecurrenceFixedData>,
  "period" | "interval" | "occurrences"
>;

export class TransactionRecurrenceFixedEntity extends Entity<TransactionRecurrenceFixedData> {
  static readonly schema = TransactionRecurrenceFixedEntitySchema;
  #lastTransactionDate: Date | null = null;

  static create(input: TransactionRecurrenceFixedDataCreateInput) {
    return new this().createEntity({
      ...input,
      id: new UniqueEntityId(input.id),
    });
  }

  static get numberOfInitialTransactionsCreated() {
    /*
      2 meses. O suficiente para exibir transações com período semanal com ocorrência em todos os dias da semana – conjunto de período e ocorrência com mais transações criadas – pelo menos no mês atual e seguinte.
    */
    return 62 as const;
  }

  public getTransactionDateFromInstallment(
    firstTransactionDate: Date = new Date(),
    currentInstallment: number,
  ) {
    const transactionDate = new Date(
      this.#lastTransactionDate?.getTime() ?? firstTransactionDate?.getTime(),
    );
    const installmentIndex = currentInstallment - 1;

    if (!this.data.occurrences) {
      if (this.data.period === "YEAR") {
        const incrementYear = installmentIndex * this.data.interval;

        transactionDate.setFullYear(
          firstTransactionDate.getFullYear() + incrementYear,
        );
      }

      if (this.data.period === "MONTH") {
        const incrementMonth = installmentIndex * this.data.interval;

        transactionDate.setMonth(
          firstTransactionDate.getMonth() + incrementMonth,
        );
      }

      if (this.data.period === "WEEK") {
        const daysFromWeek = 7;
        const incrementWeek =
          daysFromWeek * installmentIndex * this.data.interval;

        transactionDate.setDate(firstTransactionDate.getDate() + incrementWeek);
      }

      return transactionDate;
    }

    let firstOccurrenceIndex = this.data.occurrences.findIndex(occurrence => {
      if (this.data.period === "YEAR")
        return occurrence >= firstTransactionDate.getMonth() + 1;

      if (this.data.period === "MONTH")
        return occurrence >= firstTransactionDate.getDate();

      if (this.data.period === "WEEK")
        return occurrence >= firstTransactionDate.getDay() + 1;
    });
    let hasFirstOccurrenceInNextPeriod = false;

    if (firstOccurrenceIndex < 0) {
      firstOccurrenceIndex = 0;
      hasFirstOccurrenceInNextPeriod = true;
    }

    const occurrenceIndex =
      (firstOccurrenceIndex + installmentIndex) % this.data.occurrences.length;
    const occurrence = this.data.occurrences[occurrenceIndex];
    const incrementPeriodFactor = Math.floor(
      installmentIndex / this.data.occurrences.length,
    );

    if (this.data.period === "YEAR") {
      let incrementYear = incrementPeriodFactor * this.data.interval;

      if (hasFirstOccurrenceInNextPeriod) incrementYear += 1;

      transactionDate.setMonth(occurrence - 1); // month is handled as index
      transactionDate.setFullYear(
        firstTransactionDate.getFullYear() + incrementYear,
      );
    }

    if (this.data.period === "MONTH") {
      let incrementMonth = incrementPeriodFactor * this.data.interval;

      if (hasFirstOccurrenceInNextPeriod) incrementMonth += 1;

      transactionDate.setDate(occurrence);
      transactionDate.setMonth(
        firstTransactionDate.getMonth() + incrementMonth,
      );
    }

    if (this.data.period === "WEEK") {
      const lastDayWeek =
        this.#lastTransactionDate?.getDay() ?? firstTransactionDate.getDay();
      let daysUntilForNextDayWeek = (occurrence - 1 - lastDayWeek + 7) % 7;

      if (
        installmentIndex !== 0 &&
        this.data.interval < 2 &&
        daysUntilForNextDayWeek < 1
      )
        daysUntilForNextDayWeek = 7;

      if (
        installmentIndex !== 0 &&
        this.data.interval > 1 &&
        occurrence === this.data.occurrences[0]
      )
        daysUntilForNextDayWeek += this.data.interval * 7;

      const lastDay =
        this.#lastTransactionDate?.getDate() ?? firstTransactionDate.getDate();

      transactionDate.setDate(lastDay + daysUntilForNextDayWeek);
    }

    this.#lastTransactionDate = transactionDate;
    return transactionDate;
  }
}
