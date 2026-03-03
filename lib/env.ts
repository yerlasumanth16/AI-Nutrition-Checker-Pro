const requiredServerEnvs = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  // "OPENAI_API_KEY", // Optional since we use Gemini
  // "RAZORPAY_KEY_ID", // Optional for now
  // "RAZORPAY_KEY_SECRET", // Optional for now
];

const requiredClientEnvs = [
  "NEXT_PUBLIC_GEMINI_API_KEY",
];

export function validateEnv() {
  const missingEnvs: string[] = [];

  requiredServerEnvs.forEach((env) => {
    if (!process.env[env]) {
      missingEnvs.push(env);
    }
  });

  requiredClientEnvs.forEach((env) => {
    if (!process.env[env]) {
      missingEnvs.push(env);
    }
  });

  if (missingEnvs.length > 0) {
    console.error(
      "❌ Missing required environment variables:\n" +
      missingEnvs.join("\n") +
      "\n\nPlease add these to your .env file."
    );
    // We do NOT throw an error here to prevent the homepage from crashing.
    // Instead, we log it clearly.
  }
}

// Run validation immediately
validateEnv();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
};
