import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";

/** Surface card — the basic panel everywhere. */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={`rounded-xl border border-line bg-surface ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 text-muted">{icon}</span>}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover border-transparent",
  secondary: "bg-transparent text-foreground border-line hover:bg-surface-2",
  ghost: "bg-transparent text-muted border-transparent hover:text-foreground hover:bg-surface-2",
  danger: "bg-transparent border-line text-[var(--status-down)] hover:bg-[color-mix(in_oklch,var(--status-down)_12%,transparent)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${VARIANT[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${VARIANT[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <div className="mb-3 text-muted">
        {icon ?? <Inbox size={28} strokeWidth={1.5} />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-muted text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[color-mix(in_oklch,var(--status-down)_35%,transparent)] bg-[color-mix(in_oklch,var(--status-down)_10%,transparent)] px-4 py-3">
      <AlertTriangle size={18} className="text-[var(--status-down)]" />
      <p className="text-sm text-foreground">
        {message ?? "Something went wrong. Please try again."}
      </p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className}`} />;
}

/** Labeled read-only field row (asset attributes etc.) */
export function Field({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value && value !== "" ? value : <span className="text-muted">—</span>}
      </dd>
    </div>
  );
}

/** Section heading with optional icon */
export function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted">
      {icon}
      <h2 className="text-xs font-semibold uppercase tracking-wider">{children}</h2>
    </div>
  );
}
