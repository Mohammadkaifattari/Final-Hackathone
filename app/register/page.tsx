"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Wrench, Loader2, UserPlus, AlertTriangle } from "lucide-react";
import { pageFade } from "@/lib/motion";

// Client-safe role list (the Mongoose enum lives server-side).
const ROLES = ["admin", "technician", "supervisor"] as const;
type Role = (typeof ROLES)[number];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician" as Role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        setLoading(false);
        return;
      }
      // auto sign-in after register
      const signRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signRes?.error) {
        setError("Account created, but sign-in failed. Please log in.");
        setLoading(false);
        router.push("/login");
        return;
      }
      router.push("/console");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <motion.div variants={pageFade} initial="hidden" animate="show" className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <Wrench size={22} strokeWidth={2.4} />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Join the operations console</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Your name" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="you@example.com" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} placeholder="Min 6 characters" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className={inputCls}>
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--status-down)_35%,transparent)] bg-[color-mix(in_oklch,var(--status-down)_10%,transparent)] px-3 py-2">
              <AlertTriangle size={15} className="shrink-0 text-[var(--status-down)]" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><UserPlus size={16} /> Create account</>}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";
