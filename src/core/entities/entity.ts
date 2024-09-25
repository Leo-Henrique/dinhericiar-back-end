import { ZodObject, ZodRawShape } from "zod";
import {
  EntityData,
  EntityDataRaw,
  EntityDataUpdateOutput,
  EntityInstance,
} from "../@types/entity";
import { ValueObject } from "./value-object";

export abstract class Entity<Data extends EntityData> {
  #data!: Data;

  private mutate(input: Data) {
    this.#data = input;
    Object.assign(this, input);
  }

  protected createEntity(input: Data) {
    this.mutate(input);

    return this as EntityInstance<Data, this>;
  }

  protected updateEntity(input: Partial<Data>) {
    const fieldNames = Object.keys(input) as (keyof typeof input)[];
    const distinctFieldsFromOriginals = fieldNames
      .filter(fieldName => {
        const originalField = this[fieldName as keyof this] as unknown;

        return (
          input[fieldName] !== originalField && input[fieldName] !== undefined
        );
      })
      .reduce(
        (fields, distinctFieldName) => {
          const newValue = input[distinctFieldName];

          fields[distinctFieldName] = newValue;

          return fields;
        },
        {} as any, //eslint-disable-line @typescript-eslint/no-explicit-any
      );

    this.mutate(distinctFieldsFromOriginals);

    if ("updatedAt" in this) {
      this.mutate({ ...this.#data, updatedAt: new Date() });
      distinctFieldsFromOriginals.updatedAt = this.updatedAt;
    }

    return distinctFieldsFromOriginals as EntityDataUpdateOutput<Data>;
  }

  protected get data() {
    return this.#data;
  }

  public getRawData() {
    const fieldNames = Object.keys(this.#data) as (keyof Data)[];
    const rawData = fieldNames.reduce(
      (rawData, fieldName) => {
        const fieldValue = this.#data[fieldName];

        if (fieldValue instanceof ValueObject) {
          rawData[fieldName] = fieldValue.value;
        } else {
          rawData[fieldName] = fieldValue;
        }

        return rawData;
      },
      {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Object.setPrototypeOf(rawData, null) as EntityDataRaw<Data>;
  }
}

export abstract class EntitySchema {
  abstract create: ZodObject<ZodRawShape>;
  abstract update: ZodObject<ZodRawShape>;
}
