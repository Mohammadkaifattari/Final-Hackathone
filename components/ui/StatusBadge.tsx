import type { BadgeStyle } from "@/lib/status";
import { tint } from "@/lib/status";

interface StatusBadgeProps {
  style: BadgeStyle;
  size?: "sm" | "md";
  pulse?: boolean; // pulse the dot for active/ongoing states
}

/** Single badge component used for every asset/issue status + priority.
 *  Receives a BadgeStyle (label + color) so all colors stay consistent. */
export function StatusBadge({ style, size = "sm", pulse = false }: StatusBadgeProps) {
  const pad = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{
        backgroundColor: tint(style.color, 0.14),
        color: style.color,
        border: `1px solid ${tint(style.color, 0.28)}`,
      }}
    >
      <span
        className={`inline-block rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ width: 7, height: 7, backgroundColor: style.color }}
        aria-hidden
      />
      {style.label}
    </span>
  );
}
