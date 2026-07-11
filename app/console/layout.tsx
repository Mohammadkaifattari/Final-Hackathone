import type { ReactNode } from "react";
import { Sidebar } from "@/components/console/Sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/console");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={{ name: session.user.name, role: session.user.role }} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
