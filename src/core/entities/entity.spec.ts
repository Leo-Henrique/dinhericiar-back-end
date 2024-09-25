import { Entity } from "@/core/entities/entity";
import { ValueObject } from "@/core/entities/value-object";
import { faker } from "@faker-js/faker";
import { SetOptional } from "type-fest";
import { describe, expect, it } from "vitest";

class FakeStringValueObject extends ValueObject<string> {
  schema = null;
  value = "";
}

class FakeNumberValueObject extends ValueObject<number> {
  schema = null;
  value = 1 as const;
}

type FakeEntityData = {
  field1: FakeStringValueObject;
  field2: FakeNumberValueObject;
  field3: string;
  field4?: string;
  field5?: string | null;
  field6: Date | null;
  field7: Date;
};

class FakeEntity extends Entity<FakeEntityData> {
  static create(input: FakeEntityData) {
    return new this().createEntity(input);
  }

  update(input: Partial<FakeEntityData>) {
    return this.updateEntity(input);
  }
}

const fakeEntityInput = {
  field1: new FakeStringValueObject(),
  field2: new FakeNumberValueObject(),
  field3: faker.lorem.sentence(),
  field6: null,
  field7: faker.date.recent(),
} satisfies FakeEntityData;

describe("[Core] Domain Entity", () => {
  it("should be able to create a entity", () => {
    const sut = FakeEntity.create(fakeEntityInput);

    expect(sut).instanceOf(FakeEntity);

    const inputFields = Object.keys(
      fakeEntityInput,
    ) as (keyof typeof fakeEntityInput)[];

    for (const field of inputFields)
      expect(sut[field]).toEqual(fakeEntityInput[field]);
  });

  it("should be able to update a entity", () => {
    const sut = FakeEntity.create(fakeEntityInput);

    const updatedFields = { field3: faker.lorem.sentence() };

    sut.update(updatedFields);

    expect(sut).toEqual({ ...fakeEntityInput, ...updatedFields });
  });

  it("should be able to return only fields different from the original on updating the entity", () => {
    const sut = FakeEntity.create(fakeEntityInput);

    const distinctFieldsFromOriginals = { field3: faker.lorem.sentence() };
    const updatedFields = sut.update({
      field6: fakeEntityInput.field6,
      ...distinctFieldsFromOriginals,
    });

    expect(updatedFields).toEqual(distinctFieldsFromOriginals);
    expect(sut).toEqual({
      ...fakeEntityInput,
      ...distinctFieldsFromOriginals,
    });
  });

  it("should be able to ignore undefined values on updating the entity", () => {
    const field3Value = faker.lorem.sentence();

    const sut = FakeEntity.create({
      ...fakeEntityInput,
      field3: field3Value,
    });

    const updatedFields = sut.update({ field3: undefined });

    expect(updatedFields).toEqual({});
    expect(sut.field3).toEqual(field3Value);
  });

  it("should be able to return 'updatedAt' field on updating the entity when has been defined", () => {
    type AnotherFakeEntityData = FakeEntityData & {
      updatedAt: Date | null;
    };

    class AnotherFakeEntity extends Entity<AnotherFakeEntityData> {
      static create(input: SetOptional<AnotherFakeEntityData, "updatedAt">) {
        return new this().createEntity({
          updatedAt: null,
          ...input,
        });
      }

      update(input: Partial<AnotherFakeEntityData>) {
        return this.updateEntity(input);
      }
    }

    const sut = AnotherFakeEntity.create(fakeEntityInput);

    const distinctFieldsFromOriginals = { field3: faker.lorem.sentence() };
    const updatedFields = sut.update({
      field6: fakeEntityInput.field6,
      ...distinctFieldsFromOriginals,
    });

    expect(updatedFields).toMatchObject(distinctFieldsFromOriginals);
    expect(updatedFields.updatedAt).toBeInstanceOf(Date);
  });

  it("should be able to get the raw data of the entity", () => {
    const sut = FakeEntity.create(fakeEntityInput);
    const rawData = sut.getRawData();

    expect(rawData).not.toBeInstanceOf(Entity);
    expect(rawData).not.toBeInstanceOf(FakeEntity);
    expect(rawData).toEqual({
      ...fakeEntityInput,
      field1: sut.field1.value,
      field2: sut.field2.value,
    });
  });

  describe("performance", () => {
    it("should be able to create multiple instances in less than 5 milliseconds", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        FakeEntity.create(fakeEntityInput);
      }

      const endTime = performance.now();
      const elapsedTime = endTime - startTime;

      expect(elapsedTime).toBeLessThan(5);
    });

    it("should be able to update entity multiple times in less than 5 milliseconds", () => {
      const sut = FakeEntity.create(fakeEntityInput);
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        sut.update(fakeEntityInput);
      }

      const endTime = performance.now();
      const elapsedTime = endTime - startTime;

      expect(elapsedTime).toBeLessThan(5);
    });
  });
});
