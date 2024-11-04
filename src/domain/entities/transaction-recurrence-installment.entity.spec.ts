import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TransactionRecurrenceInstallmentData,
  TransactionRecurrenceInstallmentEntity,
} from "./transaction-recurrence-installment.entity";

interface GetInstallmentDatesOptions<TotalInstallments> {
  period: TransactionRecurrenceInstallmentData["period"];
  totalInstallments: TotalInstallments;
  firstTransactionDate: Date;
}

function getInstallmentDates<TotalInstallments extends number>({
  period,
  totalInstallments,
  firstTransactionDate,
}: GetInstallmentDatesOptions<TotalInstallments>) {
  const transactionRecurrenceInstallment =
    TransactionRecurrenceInstallmentEntity.create({
      period,
      installments: totalInstallments,
    });

  return Array.from({ length: totalInstallments })
    .map((_, index) => index + 1)
    .map(installment => {
      return transactionRecurrenceInstallment.getTransactionDateFromInstallment(
        firstTransactionDate,
        installment,
      );
    }) as ArrayWithExactLength<TotalInstallments, Date>;
}

describe("[Entity] Transaction Recurrence Installment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("should be able to get the transaction date of a transaction from the installment number", () => {
    describe("date of the first installment should be immutable", () => {
      it.each([
        { name: "annual", period: "YEAR" },
        { name: "monthly", period: "MONTH" },
        { name: "weekly", period: "WEEK" },
      ] as const)("with $name period", ({ period }) => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const transactionRecurrenceInstallment =
          TransactionRecurrenceInstallmentEntity.create({
            period,
            installments: 5,
          });

        const firstDate = faker.date.recent();

        const sut =
          transactionRecurrenceInstallment.getTransactionDateFromInstallment(
            firstDate,
            1,
          );

        expect(sut.getTime()).toEqual(firstDate.getTime());
      });
    });

    it("with annual period", () => {
      vi.setSystemTime(new Date(2024, 0, 1));

      const sut = getInstallmentDates({
        firstTransactionDate: new Date(2024, 1, 1),
        period: "YEAR",
        totalInstallments: 6,
      });

      expect(sut[1].getTime()).toEqual(new Date(2025, 1, 1).getTime());
      expect(sut[2].getTime()).toEqual(new Date(2026, 1, 1).getTime());
      expect(sut[3].getTime()).toEqual(new Date(2027, 1, 1).getTime());
      expect(sut[4].getTime()).toEqual(new Date(2028, 1, 1).getTime());
      expect(sut[5].getTime()).toEqual(new Date(2029, 1, 1).getTime());
    });

    it("with monthly period", () => {
      vi.setSystemTime(new Date(2024, 0, 1));

      const sut = getInstallmentDates({
        firstTransactionDate: new Date(2024, 9, 1),
        period: "MONTH",
        totalInstallments: 6,
      });

      expect(sut[1].getTime()).toEqual(new Date(2024, 10, 1).getTime());
      expect(sut[2].getTime()).toEqual(new Date(2024, 11, 1).getTime());
      expect(sut[3].getTime()).toEqual(new Date(2025, 0, 1).getTime());
      expect(sut[4].getTime()).toEqual(new Date(2025, 1, 1).getTime());
      expect(sut[5].getTime()).toEqual(new Date(2025, 2, 1).getTime());
    });

    it("with weekly period", () => {
      vi.setSystemTime(new Date(2024, 0, 1));

      const sut = getInstallmentDates({
        firstTransactionDate: new Date(2024, 1, 20),
        period: "WEEK",
        totalInstallments: 6,
      });

      expect(sut[1].getTime()).toEqual(new Date(2024, 1, 27).getTime());
      expect(sut[2].getTime()).toEqual(new Date(2024, 2, 5).getTime());
      expect(sut[3].getTime()).toEqual(new Date(2024, 2, 12).getTime());
      expect(sut[4].getTime()).toEqual(new Date(2024, 2, 19).getTime());
      expect(sut[5].getTime()).toEqual(new Date(2024, 2, 26).getTime());
    });
  });
});
