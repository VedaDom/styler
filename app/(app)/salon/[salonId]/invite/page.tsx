"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function InviteUserPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params?.salonId ?? "";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId || !email) {
      toast.error("Please provide an email.");
      return;
    }
    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      const res = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ salonId, email: email || undefined, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send invite");
      }
      router.back();
    } catch (err) {
      const message = (err as Error).message || "Failed to send invite";
      toast.error("Could not send invite", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* App Bar */}
      <div className="sticky top-0 z-10 w-full border-b bg-background/95 h-14 px-2 flex items-center backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <BackButton />
          <div className="text-xl font-semibold">Invite user</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm">Email</label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
        </div>

        <div className="grid gap-2">
          <label htmlFor="role" className="text-sm">Role</label>
          <select
            id="role"
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="MANAGER">MANAGER</option>
            <option value="RECEPTIONIST">RECEPTIONIST</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Sending..." : "Send invite"}
          </Button>
        </div>
      </form>
    </main>
  );
}

