import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { db } from "@/lib/db";
import { requireRole, requireSalonRole } from "@/lib/rbac";
import type { Role } from "@prisma/client";
import { sendEmailViaResend, sendSmsViaPindo } from "@/lib/notify";

function randToken(len = 32) {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({}));
    const salonId = typeof body?.salonId === "string" ? body.salonId : "";
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const roleStr = typeof body?.role === "string" ? body.role.toUpperCase() : "STAFF";
    const expiresInDays = typeof body?.expiresInDays === "number" ? body.expiresInDays : 14;

    if (!salonId || (!email && !phone)) {
      return NextResponse.json({ error: "Missing salonId and recipient (email or phone)" }, { status: 400 });
    }
    if (!["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CUSTOMER"].includes(roleStr)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Ensure the requester has rights over the salon: OWNER or MANAGER member
    const salon = await db.salon.findUnique({ where: { id: salonId } });
    if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    let authorized = false;
    try {
      await requireSalonRole(uid, salonId, ["OWNER", "MANAGER"]);
      authorized = true;
    } catch {
      // Fallback to legacy owner check for compatibility
      authorized = salon.ownerId === uid;
    }
    if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const token = randToken(24);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await db.invite.create({
      data: {
        token,
        email: email ?? undefined,
        phone: phone ?? undefined,
        role: roleStr as Role,
        salonId,
        createdByUserId: uid,
        expiresAt,
      },
    });

    // Build accept URL from headers
    const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
    const baseUrl = host ? `${proto}://${host}` : "";
    const acceptUrl = `${baseUrl}/api/invites/${invite.token}`;

    // Fire-and-forget notifications with environment guards
    const notifications: Array<Promise<unknown>> = [];
    if (invite.email && process.env.RESEND_API_KEY) {
      const subject = `You're invited to join ${salon.name} on Styler`;
      const html = `
        <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
          <h2>You're invited to join ${salon.name}</h2>
          <p>${decoded.name || "A salon admin"} has invited you to join <strong>${salon.name}</strong> as <strong>${invite.role}</strong>.</p>
          <p>This invite expires on <strong>${expiresAt.toDateString()}</strong>.</p>
          <p>
            <a href="${acceptUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Accept invite</a>
          </p>
          <p>If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${acceptUrl}">${acceptUrl}</a>
          </p>
        </div>`;
      notifications.push(sendEmailViaResend({ to: invite.email, subject, html }));
    }
    if (invite.phone && process.env.PINDO_API_KEY) {
      const text = `You're invited to join ${salon.name} on Styler as ${invite.role}. Accept: ${acceptUrl}`;
      notifications.push(sendSmsViaPindo({ to: invite.phone, text }));
    }
    // Do not block API response on external providers
    Promise.allSettled(notifications).then((results) => {
      if (results.some((r) => r.status === "rejected")) {
        console.warn("Invite notifications had failures", results);
      }
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error("/api/invites POST error", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
