import { EntityInstance } from "./@types/entity";

export abstract class Factory<Input> {
  abstract make(input: Input): {
    input: Input;
    entity: EntityInstance<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  abstract makeAndSave(input: Input): Promise<{
    input: Input;
    entity: EntityInstance<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }>;
}
