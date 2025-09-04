"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

// working hours moved to Settings

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [tzQuery, setTzQuery] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loadingTZ, setLoadingTZ] = useState(true);
  const [openTZ, setOpenTZ] = useState(false);
  const [localTZ, setLocalTZ] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // working hours state removed

  // Fetch available timezones from a public API
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTZ(true);
        const res = await fetch("https://worldtimeapi.org/api/timezone");
        const list = (await res.json()) as string[];
        setTimezones(list);
      } catch {
        setTimezones([]);
      } finally {
        setLoadingTZ(false);
      }
    };
    load();
  }, []);

  // Detect user's local timezone once on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setLocalTZ(tz);
    } catch {
      // ignore
    }
  }, []);

  // Once timezones are loaded, set default to local timezone if available and nothing selected yet
  useEffect(() => {
    if (!loadingTZ && !timezone && localTZ && timezones.includes(localTZ)) {
      setTimezone(localTZ);
      setTzQuery(localTZ);
    }
  }, [loadingTZ, timezone, localTZ, timezones]);

  const filteredTZ = useMemo(() => {
    const q = tzQuery.trim().toLowerCase();
    if (!q) return timezones.slice(0, 50);
    return timezones.filter((z) => z.toLowerCase().includes(q)).slice(0, 50);
  }, [tzQuery, timezones]);

  // working hours helpers removed

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !timezone || submitting) return;
    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      const res = await fetch("/api/salons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, timezone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create salon");
      }
      // Navigate to home
      router.push("/");
      router.refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Create salon failed", err);
      const message = (err as Error).message || "Failed to continue";
      toast.error("Could not create salon", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">Styler</div>
        <p className="text-base text-muted-foreground">We’re happy to have you!</p>
        <p className="text-sm text-muted-foreground">Let’s help you set up your salon.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm">
            Salon name
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Glow & Co."
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Time zone</label>
          <Popover open={openTZ} onOpenChange={setOpenTZ}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={openTZ}
                className="w-full justify-between"
                onClick={() => setOpenTZ((v) => !v)}
                onKeyDown={(e) => {
                  const key = e.key;
                  if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    setOpenTZ(true);
                    setTzQuery((prev) => prev + key);
                    e.preventDefault();
                  } else if (key === "Backspace") {
                    setOpenTZ(true);
                    setTzQuery((prev) => prev.slice(0, -1));
                    e.preventDefault();
                  } else if (key === "Enter") {
                    setOpenTZ((v) => !v);
                    e.preventDefault();
                  }
                }}
              >
                {timezone ? timezone : "Search time zone"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type to search (e.g. Europe/Paris)"
                  value={tzQuery}
                  onValueChange={(v) => setTzQuery(v)}
                />
                {loadingTZ ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading time zones…</div>
                ) : (
                  <>
                    <CommandEmpty>No matches.</CommandEmpty>
                    <CommandGroup>
                      {filteredTZ.map((z) => (
                        <CommandItem
                          key={z}
                          value={z}
                          onSelect={() => {
                            setTimezone(z);
                            setOpenTZ(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              timezone === z ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {z}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Working hours removed; will live in Settings later */}

        {/* spacer to prevent content from being hidden behind fixed footer */}
        <div className="h-20" />

        {/* Fixed bottom action bar */}
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-2xl p-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!name || !timezone || submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
