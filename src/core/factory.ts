import { EntityInstance } from "./@types/entity";

type FactoryOutput<Input> = {
  input: Input;
  entity: EntityInstance<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export abstract class Factory<Input> {
  abstract make(input: Input): FactoryOutput<Input>;
  abstract makeAndSaveUnique(input: Input): Promise<FactoryOutput<Input>>;
}
