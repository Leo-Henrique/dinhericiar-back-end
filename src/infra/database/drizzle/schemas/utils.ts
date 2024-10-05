import { customType } from "drizzle-orm/pg-core";

export const customMoneyType = customType<{ driverData: string; data: number }>(
  {
    dataType: () => "numeric(18, 2)",
    fromDriver: val => Number(val),
  },
);
