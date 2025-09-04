"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Bell, Calendar as CalendarIcon, Users, UserCheck, Settings, CreditCard, BarChart3, Clock, ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [salonCount, setSalonCount] = useState<number | null>(null);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [preset, setPreset] = useState<"today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "last_year" | "custom">("today");

  // Format numbers with k suffix for thousands and m for millions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      const millions = num / 1000000;
      return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    }
    if (num >= 1000) {
      const thousands = num / 1000;
      return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
    }
    return num.toString();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        setUserPhoto(user.photoURL ?? null);
        const token = await user.getIdToken();
        const res = await fetch("/api/salons", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = (await res.json()) as { salons: Array<{ id: string; name: string }> };
        const count = data.salons?.length ?? 0;
        if (count === 0) {
          router.replace("/onboarding");
          return;
        }
        setSalonName(data.salons[0]?.name ?? null);
        setSalonCount(count);
        setChecking(false);
      } catch {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl font-extrabold tracking-tight">Styler</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="font-extrabold tracking-tight text-xl truncate">
            {salonName ?? "Styler"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="User avatar"
                className="h-8 w-8 rounded-full border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-full border bg-muted" />
            )}
          </div>
        </div>
      </header>

      {/* Main content placeholder */}
      <main className="flex-1 space-y-3 sm:space-y-6 overflow-y-hidden">
        {/* Filters row */}
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ width: "100%", maxWidth: "100%" }}>
          <div className="flex items-center gap-2 px-4" style={{ width: "max-content" }}>
            {/* Calendar (custom range) */}
            <div className="relative">
              <Button
                variant={preset === "custom" ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setPreset("custom");
                  // Toggle a lightweight inline picker (two inputs) via simple details/summary
                  const el = document.getElementById("custom-range-popover");
                  if (el) el.toggleAttribute("open");
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <details id="custom-range-popover" className="absolute mt-2 left-0">
                <summary className="sr-only">Open custom range</summary>
                <div className="rounded-md border bg-background shadow p-3 w-[280px] space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={range.from ? new Date(range.from).toISOString().slice(0, 10) : ""}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : null;
                        setRange((r) => ({ ...r, from: d }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={range.to ? new Date(range.to).toISOString().slice(0, 10) : ""}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : null;
                        setRange((r) => ({ ...r, to: d }));
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setRange({ from: null, to: null });
                      const el = document.getElementById("custom-range-popover") as HTMLDetailsElement | null;
                      el?.removeAttribute("open");
                    }}>Clear</Button>
                    <Button size="sm" onClick={() => {
                      // Close popover; consumers can react to range state
                      const el = document.getElementById("custom-range-popover") as HTMLDetailsElement | null;
                      el?.removeAttribute("open");
                    }}>Apply</Button>
                  </div>
                </div>
              </details>
            </div>

            {/* Preset chips */}
            {[
              { k: "today", label: "Today" },
              { k: "yesterday", label: "Yesterday" },
              { k: "this_week", label: "This Week" },
              { k: "last_week", label: "Last Week" },
              { k: "this_month", label: "This Month" },
              { k: "last_month", label: "Last Month" },
              { k: "this_year", label: "This Year" },
              { k: "last_year", label: "Last Year" },
            ].map(({ k, label }) => (
              <Button
                key={k}
                size="sm"
                variant={preset === (k as typeof preset) ? "default" : "outline"}
                className="shrink-0"
                onClick={() => {
                  setPreset(k as typeof preset);
                  // Compute range based on preset
                  const now = new Date();
                  const start = new Date(now);
                  const end = new Date(now);
                  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  const firstDayOfWeek = (d: Date) => {
                    const tmp = day(d);
                    const wd = (tmp.getDay() + 6) % 7; // make Monday=0
                    tmp.setDate(tmp.getDate() - wd);
                    return tmp;
                  };
                  const lastDayOfWeek = (d: Date) => {
                    const s = firstDayOfWeek(d);
                    const e = new Date(s);
                    e.setDate(s.getDate() + 6);
                    return e;
                  };
                  const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
                  const lastDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
                  const firstDayOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
                  const lastDayOfYear = (d: Date) => new Date(d.getFullYear(), 11, 31);

                  switch (k) {
                    case "today":
                      setRange({ from: day(now), to: day(now) });
                      break;
                    case "yesterday": {
                      const y = new Date(now);
                      y.setDate(now.getDate() - 1);
                      setRange({ from: day(y), to: day(y) });
                      break;
                    }
                    case "this_week":
                      setRange({ from: firstDayOfWeek(now), to: lastDayOfWeek(now) });
                      break;
                    case "last_week": {
                      const lastW = new Date(now);
                      lastW.setDate(now.getDate() - 7);
                      setRange({ from: firstDayOfWeek(lastW), to: lastDayOfWeek(lastW) });
                      break;
                    }
                    case "this_month":
                      setRange({ from: firstDayOfMonth(now), to: lastDayOfMonth(now) });
                      break;
                    case "last_month": {
                      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      setRange({ from: firstDayOfMonth(lm), to: lastDayOfMonth(lm) });
                      break;
                    }
                    case "this_year":
                      setRange({ from: firstDayOfYear(now), to: lastDayOfYear(now) });
                      break;
                    case "last_year": {
                      const ly = new Date(now.getFullYear() - 1, 0, 1);
                      setRange({ from: firstDayOfYear(ly), to: lastDayOfYear(ly) });
                      break;
                    }
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI cards (single row on mobile) */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-2">
              <div className="text-[13px] text-muted-foreground">Appointments</div>
              <div className="mt-0.5 text-lg font-semibold">24</div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[13px] text-muted-foreground">Done</div>
              <div className="mt-0.5 text-lg font-semibold">18</div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[13px] text-muted-foreground">Revenue</div>
              <div className="mt-0.5 text-lg font-semibold">{formatNumber(85840)} <span className="hidden sm:inline text-sm text-muted-foreground">RWF</span></div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[13px] text-muted-foreground">Expenses</div>
              <div className="mt-0.5 text-lg font-semibold">{formatNumber(23000)} <span className="hidden sm:inline text-sm text-muted-foreground">RWF</span></div>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="px-4">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/appointments')}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Appointments</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/customers')}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <span className="text-sm">Customers</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/staff')}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5" />
                <span className="text-sm">Staff</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/payments')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">Payments</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/analytics')}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">Analytics</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 justify-between gap-2"
              onClick={() => router.push('/settings')}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
