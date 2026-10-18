import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
  online?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 44,
  className,
  ring = false,
  online = false,
}: AvatarProps) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-full bg-surface-2 text-ink-2 font-medium",
          ring && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes={`${size}px`}
            className="object-cover"
          />
        ) : (
          initials(name)
        )}
      </span>
      {online && (
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-surface" />
      )}
    </span>
  );
}
