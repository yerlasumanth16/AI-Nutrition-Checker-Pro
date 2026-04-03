// Environment validation
// Note: AI features now use Vercel AI Gateway which doesn't require an API key

const requiredServerEnvs: string[] = [];
const requiredClientEnvs: string[] = [];

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
    console.warn(
      "⚠️ Missing environment variables:\n" +
      missingEnvs.join("\n")
    );
  }
}

// Run validation immediately
validateEnv();

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};
