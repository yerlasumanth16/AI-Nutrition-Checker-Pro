const requiredServerEnvs: string[] = [];

const requiredClientEnvs = [
  "NEXT_PUBLIC_OPENAI_API_KEY",
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
    console.warn(
      "⚠️ Missing environment variable: NEXT_PUBLIC_OPENAI_API_KEY\n" +
      "You can add your OpenAI API key in Settings to enable AI features."
    );
  }
}

// Run validation immediately
validateEnv();

export const env = {
  NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
};
