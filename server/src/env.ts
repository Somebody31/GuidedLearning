import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash-0731"),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_BASE_URL: z.string().optional(),
  EMBEDDING_MODEL: z.string().default("qwen3-embedding-8b"),
  EMBEDDING_DIMS: z.coerce.number().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  DATA_STORE: z.enum(["memory", "postgres"]).default("memory"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
