"use client";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent: string; // oklch var/value
  hint?: string;
  alert?: boolean; // render value in accent color (for loud counts)
}

export function StatCard({ label, value, icon, accent, hint, alert }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight" style={alert ? { color: accent } : undefined}>
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </motion.div>
  );
}
