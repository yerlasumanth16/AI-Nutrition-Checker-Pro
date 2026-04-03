"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { PremiumGuard } from "../../components/PremiumGuard";
import { 
  BarChart3, 
  History, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle,
  Clock,
  Download
} from "lucide-react";
import { motion } from "motion/react";

export default function DashboardPage() {
  const { user, profile, getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const t = await getIdToken();
      setToken(t);
    };
    if (user) {
      fetchToken();
    } else {
      setToken(null);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (token) {
      fetch("/api/premium/payments", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPayments(data);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const stats = [
    { label: "Plan", value: profile?.subscriptionType === "premium" ? "Premium Pro" : "Free Plan", icon: CreditCard },
    { label: "Status", value: profile?.subscriptionStatus || "N/A", icon: CheckCircle2 },
    { label: "Renews On", value: profile?.subscriptionEnd ? new Date(profile.subscriptionEnd).toLocaleDateString() : "N/A", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.name || 'User'}</h1>
            <p className="text-zinc-500">Manage your health journey and subscription status.</p>
          </div>
          <div className="flex gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{stat.label}</p>
                  <p className="font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Feature Example */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          </div>
          <PremiumGuard featureName="Advanced Analytics">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-12 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold">Your Health Trends</h3>
                <p className="text-zinc-500">
                  Detailed charts and AI-driven insights about your nutrition and workout habits over the last 90 days.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-3xl font-bold text-emerald-500">85%</p>
                    <p className="text-xs text-zinc-500 uppercase font-bold mt-1">Goal Adherence</p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-3xl font-bold text-emerald-500">-2.4kg</p>
                    <p className="text-xs text-zinc-500 uppercase font-bold mt-1">Weight Change</p>
                  </div>
                </div>
              </div>
            </div>
          </PremiumGuard>
        </section>

        {/* Payment History */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">Payment History</h2>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-bottom border-zinc-800">
                  <th className="p-6 text-zinc-500 text-sm font-bold uppercase tracking-wider">Date</th>
                  <th className="p-6 text-zinc-500 text-sm font-bold uppercase tracking-wider">Plan</th>
                  <th className="p-6 text-zinc-500 text-sm font-bold uppercase tracking-wider">Amount</th>
                  <th className="p-6 text-zinc-500 text-sm font-bold uppercase tracking-wider">Status</th>
                  <th className="p-6 text-zinc-500 text-sm font-bold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">Loading payments...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">No payment history found.</td>
                  </tr>
                ) : (
                  payments.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-zinc-950/50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-6 font-bold">{payment.planType}</td>
                      <td className="p-6">₹{payment.amount}</td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          payment.status === 'captured' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {payment.status === 'captured' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button className="text-zinc-500 hover:text-white transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
