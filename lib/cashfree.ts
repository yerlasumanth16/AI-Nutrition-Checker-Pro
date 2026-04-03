import { Cashfree } from "cashfree-pg";

if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
  console.warn("Cashfree keys are missing in environment variables.");
}

const isProduction = process.env.NODE_ENV === "production";

export const cashfree = new Cashfree(
  isProduction ? Cashfree.PRODUCTION : Cashfree.SANDBOX,
  process.env.CASHFREE_APP_ID || "",
  process.env.CASHFREE_SECRET_KEY || ""
);

export const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID || "",
  secretKey: process.env.CASHFREE_SECRET_KEY || "",
  environment: isProduction ? "PRODUCTION" : "SANDBOX",
};
