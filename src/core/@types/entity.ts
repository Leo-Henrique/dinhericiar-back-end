import { Merge } from "type-fest";
import { Entity } from "../entities/entity";
import { ValueObject } from "../entities/value-object";
import { PrimitiveValue } from "./primitive-value";

export type EntityData = Record<string, PrimitiveValue | ValueObject>;

export type EntityDataCreate = Record<string, PrimitiveValue>;

export type EntityDataUpdate = Record<string, PrimitiveValue>;

export type EntityDataRaw<Data extends EntityData> = {
  [K in keyof Data]: Data[K] extends ValueObject ? Data[K]["value"] : Data[K];
};

export type EntityDataCreateInput<
  Data extends EntityData,
  TypeFromZodSchema extends EntityDataCreate = Record<never, never>,
  Override extends EntityDataCreate = Record<never, never>,
> = Merge<
  Merge<
    Partial<{
      [K in keyof Data]: Data[K] extends ValueObject
        ? Data[K]["value"]
        : Data[K];
    }>,
    TypeFromZodSchema
  >,
  Override
>;

type EntityDataUpdateInputOmittedFieldsDefault =
  | "id"
  | "updatedAt"
  | "createdAt";

export type EntityDataUpdateInput<
  Data extends EntityData,
  TypeFromZodSchema extends EntityDataUpdate = Record<never, never>,
  Override extends EntityDataUpdate = Record<never, never>,
> = Merge<
  Merge<
    Omit<
      Partial<{
        [K in keyof Data]: Data[K] extends ValueObject
          ? Data[K]["value"]
          : Data[K];
      }>,
      EntityDataUpdateInputOmittedFieldsDefault
    >,
    TypeFromZodSchema
  >,
  Override
>;

export type EntityDataUpdateOutput<Data extends EntityData> = Merge<
  {
    [K in keyof Data]?: Data[K];
  },
  Required<{
    [K in keyof Data as K extends "updatedAt" ? K : never]: Date;
  }>
>;

export type EntityInstance<
  Data extends EntityData,
  Class extends Entity<Data>,
> = Class & Readonly<Data>;
