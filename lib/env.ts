const requiredServerEnvs: string[] = [];

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
  }
}

// Run validation immediately
validateEnv();

export const env = {
  NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
};
