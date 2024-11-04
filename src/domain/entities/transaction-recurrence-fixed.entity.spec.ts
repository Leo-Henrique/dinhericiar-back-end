import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TransactionRecurrenceFixedData,
  TransactionRecurrenceFixedEntity,
} from "./transaction-recurrence-fixed.entity";

interface GetInstallmentDatesOptions
  extends Omit<TransactionRecurrenceFixedData, "id"> {
  firstTransactionDate?: Date;
}

function getInstallmentDates({
  firstTransactionDate,
  ...transactionRecurrenceFixedInput
}: GetInstallmentDatesOptions) {
  const transactionRecurrenceFixed = TransactionRecurrenceFixedEntity.create(
    transactionRecurrenceFixedInput,
  );

  return Array.from({ length: 10 })
    .map((_, index) => index + 1)
    .map(installment => {
      return transactionRecurrenceFixed.getTransactionDateFromInstallment(
        firstTransactionDate ?? new Date(),
        installment,
      );
    }) as ArrayWithExactLength<10, Date>;
}

describe("[Entity] Transaction Recurrence Fixed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("should be able to get the transaction date of a transaction from the installment number", () => {
    describe("date of the first installment should be immutable when without occurrences", () => {
      it.each([
        { name: "annual", period: "YEAR" },
        { name: "monthly", period: "MONTH" },
        { name: "weekly", period: "WEEK" },
      ] as const)("with $name period", ({ period }) => {
        const transactionRecurrenceFixed =
          TransactionRecurrenceFixedEntity.create({
            period,
            interval: Math.floor(Math.random() * 10) + 1,
            occurrences: null,
          });

        const firstDate = faker.date.recent();

        const sut =
          transactionRecurrenceFixed.getTransactionDateFromInstallment(
            firstDate,
            1,
          );

        expect(sut.getTime()).toEqual(firstDate.getTime());
      });
    });

    describe("with annual period", () => {
      it("and interval 1", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "YEAR",
          interval: 1,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2025, 1, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2026, 1, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2027, 1, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2028, 1, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2029, 1, 1).getTime());
      });

      it("and interval 2", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "YEAR",
          interval: 2,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2026, 1, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2028, 1, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2030, 1, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2032, 1, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2034, 1, 1).getTime());
      });

      it("and interval 3", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "YEAR",
          interval: 3,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2027, 1, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2030, 1, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2033, 1, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2036, 1, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2039, 1, 1).getTime());
      });

      it("and month occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 1,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2025, 0, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2026, 0, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2027, 0, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2028, 0, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2029, 0, 1).getTime());
      });

      it("and month occurrences 2, 3, 5", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 1,
          occurrences: [2, 3, 5],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 1, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 2, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2025, 1, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2025, 2, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2025, 4, 1).getTime());
      });

      it("and month occurrences 3, 5 with current date at the end of the year", () => {
        vi.setSystemTime(new Date(2024, 11, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 1,
          occurrences: [3, 5],
        });

        expect(sut[0].getTime()).toEqual(new Date(2025, 2, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2025, 4, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2026, 2, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2026, 4, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2027, 2, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2027, 4, 1).getTime());
      });

      it("and interval 2 with month occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 2,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2026, 0, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2028, 0, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2030, 0, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2032, 0, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2034, 0, 1).getTime());
      });

      it("and interval 3 with month occurrences 2, 3, 5", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 3,
          occurrences: [2, 3, 5],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 1, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 2, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2027, 1, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2027, 2, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2027, 4, 1).getTime());
      });

      it("and interval 4 with month occurrences 3, 5 with current date at the end of the year", () => {
        vi.setSystemTime(new Date(2024, 11, 1));

        const sut = getInstallmentDates({
          period: "YEAR",
          interval: 4,
          occurrences: [3, 5],
        });

        expect(sut[0].getTime()).toEqual(new Date(2025, 2, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2025, 4, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2029, 2, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2029, 4, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2033, 2, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2033, 4, 1).getTime());
      });
    });

    describe("with monthly period", () => {
      it("and interval 1", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "MONTH",
          interval: 1,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 2, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 3, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 5, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 6, 1).getTime());
      });

      it("and interval 2", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "MONTH",
          interval: 2,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 3, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 5, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 7, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 9, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 11, 1).getTime());
      });

      it("and interval 3", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "MONTH",
          interval: 3,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 7, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 10, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 13, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 16, 1).getTime());
      });

      it("and day occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 1,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 2, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 3, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 5, 1).getTime());
      });

      it("and day occurrences 2, 15, 25", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 1,
          occurrences: [2, 15, 25],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 2).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 15).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 25).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 1, 2).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 1, 15).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 1, 25).getTime());
      });

      it("and day occurrences 2, 25 with current date at the end of the month", () => {
        vi.setSystemTime(new Date(2024, 0, 31));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 1,
          occurrences: [2, 25],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 1, 2).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 25).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 2, 2).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 2, 25).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 3, 2).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 3, 25).getTime());
      });

      it("and interval 2 with day occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 2,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 1).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 2, 1).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 4, 1).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 6, 1).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 8, 1).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 10, 1).getTime());
      });

      it("and interval 3 with day occurrences 2, 15, 25", () => {
        vi.setSystemTime(new Date(2024, 0, 1));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 3,
          occurrences: [2, 15, 25],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 2).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 15).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 25).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 3, 2).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 3, 15).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 3, 25).getTime());
      });

      it("and interval 4 with day occurrences 2, 25 with current date at the end of the month", () => {
        vi.setSystemTime(new Date(2024, 0, 31));

        const sut = getInstallmentDates({
          period: "MONTH",
          interval: 4,
          occurrences: [2, 25],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 1, 2).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 25).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 5, 2).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 5, 25).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 9, 2).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 9, 25).getTime());
      });
    });

    describe("with weekly period", () => {
      it("and interval 1", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "WEEK",
          interval: 1,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 8).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 1, 15).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 1, 22).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 1, 29).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 2, 7).getTime());
      });

      it("and interval 2", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "WEEK",
          interval: 2,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 15).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 1, 29).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 2, 14).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 2, 28).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 3, 11).getTime());
      });

      it("and interval 3", () => {
        const sut = getInstallmentDates({
          firstTransactionDate: new Date(2024, 1, 1),
          period: "WEEK",
          interval: 3,
          occurrences: null,
        });

        expect(sut[1].getTime()).toEqual(new Date(2024, 1, 22).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 2, 14).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 3, 4).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 3, 25).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 4, 16).getTime());
      });

      it("and day week occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 7)); // getDay() = 0

        const sut = getInstallmentDates({
          period: "WEEK",
          interval: 1,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 7).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 14).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 21).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 0, 28).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 1, 4).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 1, 11).getTime());
      });

      it("and day occurrences 2, 4, 6", () => {
        vi.setSystemTime(new Date(2024, 0, 7)); // getDay() = 0

        const sut = getInstallmentDates({
          period: "WEEK",
          interval: 1,
          occurrences: [2, 4, 6],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 8).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 10).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 12).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 0, 15).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 0, 17).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 0, 19).getTime());
      });

      it("and day occurrences 2, 6 with current date at the end of the week", () => {
        vi.setSystemTime(new Date(2024, 0, 6)); // getDay() = 6

        const sut = getInstallmentDates({
          period: "WEEK",
          interval: 1,
          occurrences: [2, 6],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 8).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 12).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 15).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 0, 19).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 0, 22).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 0, 26).getTime());
      });

      it("and interval 2 with day week occurrences 1", () => {
        vi.setSystemTime(new Date(2024, 0, 7)); // getDay() = 0

        const sut = getInstallmentDates({
          period: "WEEK",
          interval: 2,
          occurrences: [1],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 7).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 21).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 1, 4).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 1, 18).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 2, 3).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 2, 17).getTime());
      });

      it("and interval 3 with day week occurrences 2, 4, 6", () => {
        vi.setSystemTime(new Date(2024, 0, 7)); // getDay() = 0

        const sut = getInstallmentDates({
          period: "WEEK",
          interval: 3,
          occurrences: [2, 4, 6],
        });

        expect(sut[0].getTime()).toEqual(new Date(2024, 0, 8).getTime());
        expect(sut[1].getTime()).toEqual(new Date(2024, 0, 10).getTime());
        expect(sut[2].getTime()).toEqual(new Date(2024, 0, 12).getTime());
        expect(sut[3].getTime()).toEqual(new Date(2024, 1, 5).getTime());
        expect(sut[4].getTime()).toEqual(new Date(2024, 1, 7).getTime());
        expect(sut[5].getTime()).toEqual(new Date(2024, 1, 9).getTime());
        expect(sut[6].getTime()).toEqual(new Date(2024, 2, 4).getTime());
        expect(sut[7].getTime()).toEqual(new Date(2024, 2, 6).getTime());
        expect(sut[8].getTime()).toEqual(new Date(2024, 2, 8).getTime());
        expect(sut[9].getTime()).toEqual(new Date(2024, 3, 1).getTime());
      });
    });
  });
});
