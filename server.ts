import express from "express";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ExpressAuth, getSession } from "@auth/express";
import Google from "@auth/express/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { User, Payment } from "./models.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));
}

const client = new MongoClient(MONGODB_URI || "");
const clientPromise = client.connect();

const app = express();
app.use(express.json());

// Auth.js Configuration
app.use("/api/auth/*", ExpressAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch additional fields from our User model
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          session.user.isPremium = dbUser.isPremium;
          session.user.freeUsageCount = dbUser.freeUsageCount;
          session.user.freeUsageResetDate = dbUser.freeUsageResetDate;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: any) {
      // Initialize custom fields for new users
      await User.findOneAndUpdate({ email: user.email }, {
        isPremium: false,
        freeUsageCount: 0,
        freeUsageResetDate: new Date(),
        createdAt: new Date(),
      }, { upsert: true });
    }
  }
}));

// Middleware to protect routes and inject user
const authenticated = async (req: any, res: any, next: any) => {
  const session = await getSession(req, {
    providers: [Google],
    secret: process.env.AUTH_SECRET,
  });
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }
  req.user = session.user;
  next();
};

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: razorpayKeyId || "rzp_test_placeholder",
  key_secret: razorpayKeySecret || "placeholder_secret",
});

// Helper to get user and handle reset logic
const getAndSyncUser = async (email: string) => {
  let user = await User.findOne({ email });
  if (!user) return null;

  const now = new Date();
  const resetDate = new Date(user.freeUsageResetDate);
  const diffTime = Math.abs(now.getTime() - resetDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    user.freeUsageCount = 0;
    user.freeUsageResetDate = now;
    await user.save();
  }
  return user;
};

// API Routes
app.get("/api/user-status", authenticated, async (req: any, res) => {
  try {
    const user = await getAndSyncUser(req.user.email);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/check-limit", authenticated, async (req: any, res) => {
  try {
    const user = await getAndSyncUser(req.user.email);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isPremium) {
      return res.json({ allowed: true });
    }

    if (user.freeUsageCount >= 2) {
      return res.json({ 
        allowed: false, 
        message: "Oops 🥺 You’ve reached your free limit. Upgrade to Premium for just ₹15/month and unlock unlimited nutrition analysis 💚" 
      });
    }

    res.json({ allowed: true });
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/increment-usage", authenticated, async (req: any, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (user && !user.isPremium) {
      user.freeUsageCount += 1;
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/create-order", authenticated, async (req, res) => {
  try {
    const options = {
      amount: 1500,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ order_id: order.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/verify-payment", authenticated, async (req: any, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const email = req.user.email;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await User.findOneAndUpdate({ email }, { 
      isPremium: true,
      subscriptionStartDate: new Date()
    });
    
    await Payment.create({
      email,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: 1500,
      status: 'SUCCESS'
    });

    res.json({ success: true, message: "You are now Premium 🎉" });
  } else {
    await Payment.create({
      email,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id || 'N/A',
      amount: 1500,
      status: 'FAILED'
    });
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

app.get("/api/payment-history", authenticated, async (req: any, res) => {
  try {
    const history = await Payment.find({ email: req.user.email }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

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

export default app;
