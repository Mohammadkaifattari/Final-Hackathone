"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gauge, Package, ClipboardList, Wrench, History, Menu, X, LogOut } from "lucide-react";

const NAV = [
  { href: "/console", label: "Dashboard", icon: Gauge, exact: true },
  { href: "/console/assets", label: "Assets", icon: Package, exact: false },
  { href: "/console/issues", label: "Issues", icon: ClipboardList, exact: false },
  { href: "/console/maintenance", label: "Maintenance", icon: Wrench, exact: false },
  { href: "/console/history", label: "History", icon: History, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const navList = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/console" className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <Wrench size={18} strokeWidth={2.4} />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-tight text-foreground">MaintainIQ</p>
        <p className="text-[10px] uppercase tracking-wider text-muted">Operations Console</p>
      </div>
    </Link>
  );

  const footer = (
    <div className="border-t border-line px-3 py-3">
      <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-foreground">
          AK
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-foreground">Ayesha Khan</p>
          <p className="text-[10px] text-muted">Admin</p>
        </div>
      </div>
      {/* Phase 2 replaces this with a real sign-out */}
      <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground">
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/console" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Wrench size={16} strokeWidth={2.4} />
          </div>
          <span className="font-display text-sm font-bold text-foreground">MaintainIQ</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/40 md:flex">
        {brand}
        {navList}
        {footer}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface">
            <div className="flex items-center justify-between">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="mr-3 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            {navList}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
