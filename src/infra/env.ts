import packageJson from "@/../package.json";
import { config } from "dotenv";
import { URL } from "url";
import { z } from "zod";

config({
  // prevent "NODE_ENV" with the value "test" automatically set by Vitest, regardless of the value set in the .env file.
  override: process.env.NODE_ENV !== "test",
});

const schema = z.object({
  NODE_ENV: z.enum(["test", "development", "production"]),
  API_NAME: z.string().default(packageJson.name),
  API_PORT: z.coerce.number().default(3333),
  API_ACCESS_PERMISSION_CLIENT_SIDE: z
    .string()
    .url()
    .transform(value => new URL(value).toString()),
  POSTGRES_USERNAME: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_HOSTNAME: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DATABASE: z.string(),
  RESEND_API_KEY: z.string(),
  RESEND_EMAIL_SENDER: z.string().email(),
});

const parsedEnv = schema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(parsedEnv.error.flatten().fieldErrors);

  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;
