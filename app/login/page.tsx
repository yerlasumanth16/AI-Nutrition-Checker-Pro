"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("Account created successfully! Please sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter uppercase">Sign In</h1>
        <p className="text-zinc-400 text-lg">Access your AI nutrition dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Address */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full pl-12 pr-4 py-4 bg-[#1E293B] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="yerlasumanth16@gmail.com"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="block w-full pl-12 pr-12 py-4 bg-[#1E293B] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              SIGN IN
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="pt-8 text-center space-y-4">
        <p className="text-zinc-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-emerald-500 font-bold hover:underline">
            Create one now
          </Link>
        </p>
        
        <div className="flex items-center gap-4 py-4">
          <div className="h-px flex-1 bg-zinc-800"></div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Or continue with</span>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        <button
          onClick={() => signIn("google")}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-emerald-500" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
