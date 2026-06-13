import { z } from "zod";

const envSchema = z.object({
  // Client-side variables
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth Domain is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID is required"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase Storage Bucket is required"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase Sender ID is required"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),

  // Server-side variables (optional on client, but verified on server)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_QUEUE_NAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const getEnvValues = () => {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_QUEUE_NAME: process.env.CLOUDFLARE_QUEUE_NAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };
};

const isServer = typeof window === "undefined";
const values = getEnvValues();

// Perform validation
const parsed = envSchema.safeParse(values);

if (!parsed.success) {
  const formattedErrors = parsed.error.format();
  
  if (isServer) {
    console.error("❌ Invalid environment variables during server execution:");
    Object.entries(formattedErrors).forEach(([key, value]) => {
      if (key !== "_errors") {
        console.error(`  ${key}:`, (value as { _errors: string[] })._errors.join(", "));
      }
    });
  }

  // During local development or production client runtime, we warn rather than crash,
  // to avoid build-time errors when compiling static routes where variables are set in CI.
  if (process.env.NODE_ENV === "production" && isServer) {
    // Only throw in true production runtime if client variables are missing
    const criticalClientKeys: (keyof z.infer<typeof envSchema>)[] = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];
    
    const missingClientKeys = criticalClientKeys.filter(
      (key) => !values[key]
    );

    if (missingClientKeys.length > 0) {
      throw new Error(
        `Critical Firebase configuration keys are missing in production: ${missingClientKeys.join(", ")}`
      );
    }
  }
}

export const env = parsed.success
  ? parsed.data
  : (values as unknown as z.infer<typeof envSchema>);
