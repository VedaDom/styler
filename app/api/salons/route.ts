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

    if (!name || !timezone) {
      return NextResponse.json({ error: "Missing name or timezone" }, { status: 400 });
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

    const salon = await db.salon.create({
      data: {
        name,
        timezone,
        ownerId: uid,
      },
    });

    return NextResponse.json({ salon }, { status: 201 });
  } catch (err) {
    console.error("/api/salons POST error", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
