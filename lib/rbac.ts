import { db } from "@/lib/db";

export type UserRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF" | "CUSTOMER";

// Deprecated global role helpers (User.role removed). Keep signatures for backward compat, but no-op / throw.
export async function getUserRole(_userId: string): Promise<UserRole | null> {
  return null;
}

export async function hasRole(_userId: string, _roles: UserRole | UserRole[]): Promise<boolean> {
  return false;
}

export async function requireRole(_userId: string, roles: UserRole | UserRole[]) {
  const needed = Array.isArray(roles) ? roles.join(", ") : roles;
  throw new Error(
    `Global roles are deprecated. Use requireSalonRole(userId, salonId, [${needed}]) instead.`,
  );
}

// Salon-scoped RBAC using SalonMember
export async function getSalonRole(userId: string, salonId: string): Promise<UserRole | null> {
  const member = await db.salonMember.findUnique({
    where: { userId_salonId: { userId, salonId } },
    select: { role: true },
  });
  return (member?.role as UserRole) ?? null;
}

export async function hasSalonRole(
  userId: string,
  salonId: string,
  roles: UserRole | UserRole[],
): Promise<boolean> {
  const role = await getSalonRole(userId, salonId);
  if (!role) return false;
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.includes(role);
}

export async function requireSalonRole(
  userId: string,
  salonId: string,
  roles: UserRole | UserRole[],
) {
  const ok = await hasSalonRole(userId, salonId, roles);
  if (!ok) {
    const needed = Array.isArray(roles) ? roles.join(", ") : roles;
    throw new Error(`Forbidden: requires role ${needed} in salon ${salonId}`);
  }
}
