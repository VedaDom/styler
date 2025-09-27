import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];

    // Verify Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Upsert user in Prisma using Firebase UID as primary id
    const email = decoded.email ?? null;
    const name = decoded.name ?? null;
    const image = decoded.picture ?? null;

    await db.user.upsert({
      where: { id: uid },
      update: { email: email ?? undefined, name: name ?? undefined, image: image ?? undefined },
      create: { id: uid, email, name, image },
    });

    // Fetch salons owned by this user
    const salons = await db.salon.findMany({
      where: { ownerId: uid },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ salons });
  } catch (err) {
    console.error("/api/salons error", err);
    // If token verification fails, treat as unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const timezone = typeof body?.timezone === "string" ? body.timezone.trim() : "";
    const currencyRaw = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : "";
    const taxRateRaw =
      typeof body?.taxRate === "number"
        ? body.taxRate
        : typeof body?.taxRate === "string" && body.taxRate.trim() !== ""
        ? Number(body.taxRate)
        : null;

    if (!name || !timezone) {
      return NextResponse.json({ error: "Missing name or timezone" }, { status: 400 });
    }

    // Validate optional currency (ISO-4217-ish simple check)
    const currency = currencyRaw && /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : undefined;

    // Validate optional tax rate (0-100)
    let taxRate: number | null = null;
    if (typeof taxRateRaw === "number" && !Number.isNaN(taxRateRaw)) {
      if (taxRateRaw < 0 || taxRateRaw > 100) {
        return NextResponse.json({ error: "Invalid taxRate; expected 0-100" }, { status: 400 });
      }
      taxRate = Number(taxRateRaw.toFixed(2));
    }

    // Ensure user exists
    const email = decoded.email ?? null;
    const displayName = decoded.name ?? null;
    const image = decoded.picture ?? null;
    await db.user.upsert({
      where: { id: uid },
      update: {
        email: email ?? undefined,
        name: displayName ?? undefined,
        image: image ?? undefined,
      },
      create: { id: uid, email, name: displayName, image },
    });

    // Create the salon and create an OWNER membership for the creator
    const result = await db.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name,
          timezone,
          ownerId: uid,
          ...(currency ? { currency } : {}),
          ...(taxRate !== null ? { taxRate } : {}),
        },
      });
      await tx.salonMember.upsert({
        where: { userId_salonId: { userId: uid, salonId: salon.id } },
        update: { role: "OWNER" },
        create: { userId: uid, salonId: salon.id, role: "OWNER" },
      });
      return { salon };
    });

    return NextResponse.json({ salon: result.salon }, { status: 201 });
  } catch (err) {
    console.error("/api/salons POST error", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
