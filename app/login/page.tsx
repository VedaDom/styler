"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      window.location.href = "/";
    } catch (e) {
      const message = (e as Error)?.message || "Sign-in failed";
      toast.error("Google sign-in failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-10">
      <main className="flex-1 w-full flex flex-col items-center justify-center text-center gap-6">
        <div className="text-5xl font-extrabold tracking-tight">Styler</div>
        <p className="max-w-md text-balance text-muted-foreground">
          Run your salon smarter. Appointments, staff, and growth—all in one simple workspace.
        </p>
      </main>

      <div className="w-full max-w-sm">
        <button
          onClick={onGoogle}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-foreground text-background px-4 py-3 text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 48 48"
            aria-hidden
          >
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303C33.602 32.658 29.171 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.152 7.961 3.039l5.657-5.657C34.676 6.053 29.614 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.816C14.655 16.262 18.961 14 24 14c3.059 0 5.842 1.152 7.961 3.039l5.657-5.657C34.676 6.053 29.614 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.091 0 9.8-1.947 13.294-5.123l-6.142-5.197C29.074 35.091 26.671 36 24 36c-5.145 0-9.489-3.317-11.056-7.946l-6.58 5.066C9.672 39.556 16.337 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303c-1.356 3.658-4.771 6.363-8.868 6.863l6.142 5.197C36.053 38.689 40 32.835 40 24c0-1.341-.138-2.651-.389-3.917z"
            />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
