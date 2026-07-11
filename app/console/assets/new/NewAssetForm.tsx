"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui/primitives";
import { CATEGORIES, type AssetCondition } from "@/lib/types";
import { pageFade } from "@/lib/motion";
import { createAssetAction } from "@/app/actions/assets";

const CONDITIONS: AssetCondition[] = ["Excellent", "Good", "Fair", "Poor"];

export function NewAssetForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    assetCode: "",
    category: CATEGORIES[0] as string,
    location: "",
    condition: "Good" as AssetCondition,
  });
  const [error, setError] = useState("");

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.assetCode.trim() || !form.location.trim()) {
      setError("Name, asset code, and location are required.");
      return;
    }
    setSaving(true);
    const result = await createAssetAction({
      name: form.name,
      assetCode: form.assetCode,
      category: form.category,
      location: form.location,
      condition: form.condition,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "An unknown error occurred.");
      return;
    }
    // Success — go to the new asset's detail page (shows the generated QR).
    router.push(`/console/assets/${result.id}`);
    router.refresh();
  };

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-6">
      <Link href="/console/assets" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Assets
      </Link>
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Register New Asset</h1>
        <p className="text-sm text-muted text-pretty">
          A unique asset code and QR sticker are generated on creation. The public QR ID never changes.
        </p>
      </header>

      <Card>
        <CardHeader title="Asset Information" icon={<QrCode size={16} />} />
        <form onSubmit={submit} className="space-y-5 px-5 py-5">
          <FormField label="Asset Name" required>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Classroom Projector 01"
              className={inputCls}
            />
          </FormField>
          <FormField label="Asset Code" required hint="Must be unique. Duplicates are rejected.">
            <input
              value={form.assetCode}
              onChange={(e) => update("assetCode", e.target.value.toUpperCase())}
              placeholder="e.g. AV-PRJ-0001"
              className={`${inputCls} font-mono`}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Category">
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Condition">
              <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className={inputCls}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Location" required>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Block C · Room 204"
              className={inputCls}
            />
          </FormField>

          {error && <p className="text-sm text-[var(--status-down)]">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Link href="/console/assets" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
              Cancel
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create Asset</>}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-[var(--status-down)]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
