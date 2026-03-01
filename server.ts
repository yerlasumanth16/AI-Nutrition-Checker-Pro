import express from "express";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    premium BOOLEAN DEFAULT 0,
    free_usage_count INTEGER DEFAULT 0,
    last_reset_date TEXT
  )
`);

const app = express();
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

// Helper to get or create user
const getUser = (email: string) => {
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  if (!user) {
    db.prepare("INSERT INTO users (email, premium, free_usage_count, last_reset_date) VALUES (?, 0, 0, ?)")
      .run(email, monthStart);
    user = { email, premium: 0, free_usage_count: 0, last_reset_date: monthStart };
  } else {
    // Reset count every 30 days (simplified to calendar month for this demo)
    const lastReset = new Date(user.last_reset_date);
    const diffTime = Math.abs(now.getTime() - lastReset.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      db.prepare("UPDATE users SET free_usage_count = 0, last_reset_date = ? WHERE email = ?")
        .run(monthStart, email);
      user.free_usage_count = 0;
      user.last_reset_date = monthStart;
    }
  }
  return user;
};

// API Routes
app.get("/api/user-status", (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = getUser(email);
  res.json(user);
});

app.post("/api/check-limit", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  
  const user = getUser(email);
  if (user.premium) {
    return res.json({ allowed: true });
  }

  if (user.free_usage_count >= 2) {
    return res.json({ 
      allowed: false, 
      message: "Oops 🥺 You’ve reached your free limit. Upgrade to Premium for just ₹15/month and enjoy unlimited nutrition insights 💚" 
    });
  }

  res.json({ allowed: true });
});

app.post("/api/increment-usage", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  
  const user = getUser(email);
  if (!user.premium) {
    db.prepare("UPDATE users SET free_usage_count = free_usage_count + 1 WHERE email = ?")
      .run(email);
  }
  res.json({ success: true });
});

app.post("/api/create-order", async (req, res) => {
  try {
    const options = {
      amount: 1500, // 1500 paise = ₹15
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ order_id: order.id });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    db.prepare("UPDATE users SET premium = 1 WHERE email = ?").run(email);
    res.json({ success: true, message: "You are now Premium 🎉" });
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
