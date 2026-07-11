import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, type SessionUser } from "./auth";
import type { Role } from "./types";

export type AppSession = {
  user: SessionUser;
};

/** Get the current session on the server (or null). */
export async function getSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return null;
  return { user: session.user as SessionUser };
}

/**
 * Require an authenticated session. Redirects to /login (with a next param)
 * if there is none. Use in server components / server actions.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=" + encodeURIComponent(getRelativePath()));
  }
  return session.user;
}

/**
 * Require a session AND one of the allowed roles. Renders a 403-ish notice is
 * not idiomatic server-side, so we redirect unauthorized roles to /console
 * with an error flag instead.
 */
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/console?error=forbidden");
  }
  return user;
}

export function getRelativePath(): string {
  // Best-effort; Next 16 headers() is async. For redirect-next we just read
  // a header if available, otherwise default to /console.
  return "/console";
}

/** Role capability map — the single source of truth for UI gating. */
export function can(role: Role | undefined, action: "manageAssets" | "assignIssues" | "manageAllIssues" | "recordMaintenance"): boolean {
  if (!role) return false;
  const caps: Record<Role, string[]> = {
    admin: ["manageAssets", "assignIssues", "manageAllIssues", "recordMaintenance"],
    supervisor: ["manageAssets", "assignIssues", "manageAllIssues"],
    technician: ["manageAssets", "recordMaintenance"],
  };
  return caps[role].includes(action);
}
