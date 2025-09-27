import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSalonRole } from "@/lib/rbac";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BackButton from "@/components/BackButton";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SalonStaffPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;

  let userId: string | undefined = undefined;
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? undefined;
    if (!email) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/salon/${salonId}/staff`)}`);
    }
    const user = await db.user.findUnique({ where: { email: email! }, select: { id: true } });
    userId = user?.id;
  } catch (err) {
    console.error("getServerSession failed — check NEXTAUTH_URL and NEXTAUTH_SECRET", err);
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">
          Authentication is not configured. Please set NEXTAUTH_URL and NEXTAUTH_SECRET in your environment.
        </p>
      </main>
    );
  }
  if (!userId) {
    // No matching user in DB or not signed in: send to login and return after authentication
    redirect(`/login?callbackUrl=${encodeURIComponent(`/salon/${salonId}/staff`)}`);
  }

  // Authorization: only OWNER or MANAGER can view staff for this salon
  try {
    await requireSalonRole(userId, salonId, ["OWNER", "MANAGER"]);
  } catch {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">You do not have permission to view this salon's staff.</p>
      </main>
    );
  }

  const members = await db.salonMember.findMany({
    where: { salonId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  type MemberWithUser = typeof members[number];

  return (
    <main className="mx-auto max-w-3xl flex min-h-screen flex-col">
      {/* App Bar */}
      <div className="sticky top-0 z-10 w-full border-b bg-background/95 h-14 px-2 flex items-center backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <BackButton />
          <div className="text-xl font-semibold">Staff</div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-20">
        <ul className="divide-y">
          {members.map((m: MemberWithUser) => (
            <li key={m.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.user?.image ?? undefined} alt={m.user?.name ?? m.user?.email ?? "User"} />
                  <AvatarFallback>
                    {(m.user?.name || m.user?.email || "U")
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{m.user?.name ?? m.user?.email ?? "Unnamed"}</div>
                  <div className="text-sm text-muted-foreground">{m.role}</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </li>
          ))}
          {members.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">No staff yet.</li>
          )}
        </ul>
      </div>

      {/* FAB */}
      <Link
        href={`/salon/${salonId}/invite`}
        className="fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
        aria-label="Invite user"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </main>
  );
}
