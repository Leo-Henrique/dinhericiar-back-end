import { EntityInstance } from "./@types/entity";

export abstract class Factory<Input> {
  abstract make(input: Input): Promise<{
    input: Input;
    entity: EntityInstance<unknown, unknown>;
  }>;

  abstract makeAndSave(input: Input): Promise<{
    input: Input;
    entity: EntityInstance<unknown, unknown>;
  }>;
}
