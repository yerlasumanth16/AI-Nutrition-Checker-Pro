import { Cashfree } from "cashfree-pg";

if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
  console.warn("Cashfree keys are missing in environment variables.");
}

const isProduction = process.env.NODE_ENV === "production";

// Configure Cashfree SDK v5+ (static configuration)
Cashfree.XClientId = process.env.CASHFREE_APP_ID || "";
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || "";
Cashfree.XEnvironment = isProduction ? Cashfree.Environment.PRODUCTION : Cashfree.Environment.SANDBOX;

export { Cashfree };

export const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID || "",
  secretKey: process.env.CASHFREE_SECRET_KEY || "",
  environment: isProduction ? "PRODUCTION" : "SANDBOX",
};
