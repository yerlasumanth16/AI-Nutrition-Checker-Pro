"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, Shield, Zap, BarChart3, FileText, Calendar, CreditCard, Clock, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const { user, firebaseUser, getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      const t = await getIdToken();
      setToken(t);
    };
    if (firebaseUser) {
      fetchToken();
    } else {
      setToken(null);
    }
  }, [firebaseUser, getIdToken]);

  useEffect(() => {
    if (user && token) {
      fetchPaymentHistory();
    }
  }, [user, token]);

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/premium/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will keep your premium access until the end of the current billing cycle.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/premium/cancel-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Subscription cancelled successfully.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      // Trigger login modal or redirect to login
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create subscription on backend
      const res = await fetch("/api/premium/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate subscription");

      // 2. Open Razorpay Checkout
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "NutriAI Premium",
        description: "Premium Nutrition Pro - ₹15/month",
        image: "https://picsum.photos/seed/nutriai/200/200",
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch("/api/premium/verify-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              // Update local auth state
              router.push("/dashboard?premium=success");
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (err: any) {
            setError(err.message);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#10b981", // emerald-500
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: "Unlimited AI Analysis", desc: "Scan as many food items as you want without daily limits." },
    { icon: BarChart3, title: "Advanced Analytics", desc: "Detailed weekly and monthly health trends and insights." },
    { icon: FileText, title: "Professional PDF Reports", desc: "Generate and download comprehensive health reports for your doctor." },
    { icon: Zap, title: "AI Diet Planning", desc: "Personalized meal plans generated by our advanced AI models." },
    { icon: Calendar, title: "Long-term Tracking", desc: "Keep your health history forever with unlimited data storage." },
    { icon: Shield, title: "Priority Support", desc: "Get faster responses from our health and technical experts." },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Premium Nutrition Pro</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Elevate Your <span className="text-emerald-500">Health Journey</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Unlock the full potential of NutriAI with our premium plan. Advanced insights, personalized plans, and unlimited analysis for less than a cup of tea.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-emerald-500/50 transition-colors group"
                >
                  <feature.icon className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {user?.subscriptionType === "premium" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-emerald-500" />
                    Subscription Management
                  </h2>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  }`}>
                    {user.subscriptionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Next Renewal</p>
                    <p className="text-xl font-bold text-white">
                      {user.subscriptionEnd ? new Date(user.subscriptionEnd).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 space-y-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Plan Type</p>
                    <p className="text-xl font-bold text-emerald-500">Premium Nutrition Pro</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {user.subscriptionStatus === 'active' ? (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Cancel Subscription
                    </button>
                  ) : (
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Renew Subscription
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="text-emerald-500" />
                  Payment History
                </h2>
                <button onClick={fetchPaymentHistory} className="text-zinc-500 hover:text-white transition-colors">
                  <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                      <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                      <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                      <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 italic">No payment history found.</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id} className="group">
                          <td className="py-4 text-sm text-zinc-300">{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-sm font-bold text-white">₹{payment.amount}</td>
                          <td className="py-4 text-sm">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              payment.status === 'captured' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-zinc-500 font-mono">{payment.razorpayPaymentId || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border-2 border-emerald-500 rounded-[2.5rem] p-10 relative overflow-hidden sticky top-24"
            >
            <div className="absolute top-0 right-0 p-8">
              <Sparkles className="w-12 h-12 text-emerald-500/20" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Premium Pro</h2>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-bold">₹15</span>
                <span className="text-zinc-500 text-xl">/ month</span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-zinc-300">Auto-renewing subscription</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-zinc-300">Cancel anytime, no questions asked</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-zinc-300">All premium features included</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpgrade}
                disabled={loading || user?.subscriptionType === "premium"}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : user?.subscriptionType === "premium" ? (
                  "Currently Subscribed"
                ) : (
                  "Upgrade Now"
                )}
              </button>
              
              <p className="text-center text-zinc-500 text-sm mt-6">
                Secure payment via Razorpay. All major cards & UPI accepted.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);
}
