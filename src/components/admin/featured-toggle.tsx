"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSetFeatured } from "@/app/admin/actions";

export function FeaturedToggle({ id, featured, readonly }: { id: string; featured: boolean; readonly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (readonly) return featured ? <Star className="size-4 fill-accent text-accent" /> : null;
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await adminSetFeatured(id, !featured);
          router.refresh();
        })
      }
      className={cn("u-press inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", featured ? "bg-accent-tint text-accent-hover" : "border border-line text-ink-2 hover:text-ink")}
    >
      <Star className={cn("size-3.5", featured && "fill-accent text-accent")} /> {featured ? "Featured" : "Feature"}
    </button>
  );
}
