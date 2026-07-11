"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Wrench, Loader2, LogIn, AlertTriangle } from "lucide-react";
import { pageFade } from "@/lib/motion";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/console";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  const fillDemo = (role: "admin" | "technician" | "supervisor") => {
    const map = {
      admin: { e: "admin@maintainiq.app", p: "admin123" },
      technician: { e: "tech@maintainiq.app", p: "tech123" },
      supervisor: { e: "supervisor@maintainiq.app", p: "super123" },
    };
    setEmail(map[role].e);
    setPassword(map[role].p);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <motion.div
        variants={pageFade}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <Wrench size={22} strokeWidth={2.4} />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight">Sign in to MaintainIQ</h1>
          <p className="mt-1 text-sm text-muted">Operations console access</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--status-down)_35%,transparent)] bg-[color-mix(in_oklch,var(--status-down)_10%,transparent)] px-3 py-2">
              <AlertTriangle size={15} className="shrink-0 text-[var(--status-down)]" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <><LogIn size={16} /> Sign in</>}
          </button>
        </form>

        {/* demo credentials helper */}
        <div className="rounded-xl border border-line bg-surface/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Demo accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {(["admin", "technician", "supervisor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => fillDemo(r)}
                className="rounded-lg border border-line px-2 py-1.5 text-xs text-muted capitalize transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">Click a role to autofill. Seed via the /api/seed endpoint first.</p>
        </div>

        <p className="text-center text-xs text-muted">
          Need an account?{" "}
          <Link href="/register" className="text-accent hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
