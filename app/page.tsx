import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold">Nutrition Analysis Platform</h1>
      <p className="max-w-2xl text-zinc-300">Production-ready AI-powered nutrition SaaS with auth, billing, analytics, and premium plans.</p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded-md bg-emerald-600 px-4 py-2">Login</Link>
        <Link href="/register" className="rounded-md border border-zinc-700 px-4 py-2">Create Account</Link>
      </div>
    </main>
  );
}
