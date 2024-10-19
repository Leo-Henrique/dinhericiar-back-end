import { ZodTypeAny } from "zod";

export type ZodRestrictFieldsShape<Target> = {
  [K in keyof Target]?: ZodTypeAny;
};
