import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  isPremium: boolean;
  freeUsageCount: number;
  freeUsageResetDate: Date;
  createdAt: Date;
  subscriptionStartDate?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  email: { type: String, unique: true, required: true },
  image: String,
  isPremium: { type: Boolean, default: false },
  freeUsageCount: { type: Number, default: 0 },
  freeUsageResetDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  subscriptionStartDate: Date,
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export interface IPayment extends Document {
  email: string;
  order_id: string;
  payment_id: string;
  amount: number;
  status: string;
  timestamp: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>({
  email: String,
  order_id: String,
  payment_id: String,
  amount: Number,
  status: String,
  timestamp: { type: Date, default: Date.now },
});

export const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
