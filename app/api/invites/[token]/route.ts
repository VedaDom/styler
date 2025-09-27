import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const invite = await db.invite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ valid: false, reason: "accepted" }, { status: 400 });
    if (invite.expiresAt < new Date())
      return NextResponse.json({ valid: false, reason: "expired" }, { status: 400 });

    return NextResponse.json({ valid: true, invite: { token: invite.token, salonId: invite.salonId, role: invite.role, email: invite.email, phone: invite.phone, expiresAt: invite.expiresAt } });
  } catch (err) {
    console.error("/api/invites/[token] GET error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const { token } = await context.params;
    const invite = await db.invite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 400 });

    // Basic acceptance: ensure user exists, then assign role indicated by invite
    const email = decoded.email ?? null;
    const name = decoded.name ?? null;
    const image = decoded.picture ?? null;

    await db.user.upsert({
      where: { id: uid },
      update: { email: email ?? undefined, name: name ?? undefined, image: image ?? undefined },
      create: { id: uid, email, name, image },
    });

    await db.$transaction(async (tx) => {
      // Mark invite accepted
      await tx.invite.update({
        where: { token },
        data: { acceptedAt: new Date(), acceptedByUserId: uid },
      });

      // Ensure salon membership with role from invite
      await tx.salonMember.upsert({
        where: { userId_salonId: { userId: uid, salonId: invite.salonId } },
        update: { role: invite.role as Role },
        create: { userId: uid, salonId: invite.salonId, role: invite.role as Role },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/invites/[token] POST error", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
