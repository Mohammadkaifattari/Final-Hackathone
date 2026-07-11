import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface text-muted">
        <QrCode size={28} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-balance">Page not found</h1>
        <p className="max-w-sm text-sm text-muted text-pretty">
          The asset or page you’re looking for doesn’t exist or may have been moved.
        </p>
      </div>
      <Link
        href="/console"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
    </div>
  );
}
