"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", { email, password, redirect: false });
    if (!result?.error) router.push("/dashboard"); else alert(result.error);
  };

  return <div className="mx-auto max-w-md p-8 space-y-3"><h1 className="text-2xl font-semibold">Login</h1>
    <form className="space-y-3" onSubmit={submit}>
      <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button>Sign in</Button>
    </form>
    <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>Sign in with Google</Button>
  </div>;
}
