import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { Name } from "./name";

let name: string;

describe("[Value Object] Name", () => {
  beforeEach(() => {
    name = faker.person.fullName();
  });

  it("should be able to create a name", async () => {
    const { value } = new Name(name);

    expect(value).toEqual(name);
  });

  it("should be able to accept input containing conventional names of people", async () => {
    const personNamesValidationResult = [];

    for (let i = 1; i <= 50; i++) {
      const personNameResult = Name.schema.safeParse(faker.person.fullName());

      personNamesValidationResult.push(personNameResult.success);
    }

    expect(personNamesValidationResult).not.toContain(false);
  });

  it("should be able to accept input containing conventional names of companies", async () => {
    const companyNamesValidationResult = [];

    for (let i = 1; i <= 50; i++) {
      const companyNameResult = Name.schema.safeParse(faker.company.name());

      companyNamesValidationResult.push(companyNameResult.success);
    }

    expect(companyNamesValidationResult).not.toContain(false);
  });

  describe("Invalidations", () => {
    it("should not be able to accept input containing numbers", async () => {
      const { success } = Name.schema.safeParse(
        `${name} ${faker.number.int()}`,
      );

      expect(success).toBeFalsy();
    });

    it("should not be able to accept input containing special characters", async () => {
      const validationsResult = [];
      const validCharacters = [" ", ",", ".", "-"];

      for (let i = 1; i <= 50; i++) {
        const specialCharacter = faker.string.symbol();
        const validateResult = Name.schema.safeParse(
          `${name} ${specialCharacter}`,
        );

        // faker.string.symbol() can generate characters that are valid by the Name value object regex
        if (
          validateResult.success &&
          validCharacters.includes(specialCharacter)
        ) {
          return validationsResult.push(false);
        }

        validationsResult.push(validateResult.success);
      }

      expect(validationsResult).not.toContain(true);
    });

    it("should not be able to accept input containing emoji", async () => {
      const validationsResult = [];

      for (let i = 1; i <= 50; i++) {
        const { success } = Name.schema.safeParse(
          `${name} ${faker.internet.emoji()}`,
        );

        validationsResult.push(success);
      }

      expect(validationsResult).not.toContain(true);
    });
  });

  describe("Transformations", () => {
    it("should be able to remove spacings the beginning and end of the name", async () => {
      const result = Name.schema.safeParse(`  ${name}  `);

      if (result.success) {
        expect(result.data).toEqual(name.trim());
      }
    });
  });
});
