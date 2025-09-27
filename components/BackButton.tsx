"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
