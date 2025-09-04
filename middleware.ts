import { NextResponse } from "next/server";

// Edge-safe pass-through middleware. We'll reintroduce auth checks later
// using server actions/route handlers or a lightweight session check.
export default function middleware() {
  return NextResponse.next();
}

// Protect all routes except Next internals, API auth callbacks, and static
export const config = {
  matcher: ["/((?!_next|api/auth|api/stripe|.*\\..*|favicon.ico).*)"],
};
