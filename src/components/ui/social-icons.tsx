import type { SVGProps, ReactElement } from "react";

type Platform = "instagram" | "tiktok" | "youtube" | "twitch" | "x" | "snapchat";

function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5.01-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.74.36-1.06.68-.32.32-.52.63-.68 1.06-.13.32-.28.8-.32 1.7C3.44 8.5 3.43 8.86 3.43 12s.01 3.5.07 4.74c.04.9.19 1.38.32 1.7.16.43.36.74.68 1.06.32.32.63.52 1.06.68.32.13.8.28 1.7.32 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.74-.36 1.06-.68.32-.32.52-.63.68-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.85 2.85 0 0 0-.68-1.06 2.85 2.85 0 0 0-1.06-.68c-.32-.13-.8-.28-1.7-.32-1.24-.06-1.6-.07-4.74-.07Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.15-2.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </svg>
  );
}
function TikTok(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.6a4.9 4.9 0 0 1-3-2.6 4.9 4.9 0 0 1-.26-1h-3.3v12.6a2.6 2.6 0 1 1-2.6-2.6c.26 0 .5.04.74.1V8.74a5.9 5.9 0 0 0-.74-.05 5.9 5.9 0 1 0 5.9 5.9V8.1a8.1 8.1 0 0 0 3.26.98V5.8c-.01 0-.01 0 0-.2Z" />
    </svg>
  );
}
function YouTube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23 7.5s-.22-1.56-.9-2.25c-.86-.9-1.82-.9-2.26-.96C16.73 4.07 12 4.07 12 4.07h-.01s-4.72 0-7.83.22c-.44.06-1.4.06-2.26.96C1.22 5.94 1 7.5 1 7.5S.78 9.33.78 11.16v1.67C.78 14.66 1 16.5 1 16.5s.22 1.56.9 2.25c.86.9 2 .87 2.5.96 1.82.17 7.6.22 7.6.22s4.73-.01 7.84-.23c.44-.06 1.4-.06 2.26-.96.68-.69.9-2.25.9-2.25s.22-1.84.22-3.67v-1.67C23.22 9.33 23 7.5 23 7.5ZM9.75 14.6V9.4l4.95 2.6-4.95 2.6Z" />
    </svg>
  );
}
function Twitch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.3 2 3 5.5v13.1h4.5V21h2.5l2.4-2.4h3.6L21 13.6V2H4.3Zm15 10.8-2.6 2.6h-3.6l-2.4 2.4v-2.4H7.5V3.5h11.8v9.3ZM16.1 6.6v4.3h-1.5V6.6h1.5Zm-4 0v4.3h-1.5V6.6h1.5Z" />
    </svg>
  );
}
function X(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.5h7.6l5.24 6.93L18.9 1.5Zm-1.29 18.8h2.04L6.48 3.6H4.3l13.31 16.7Z" />
    </svg>
  );
}

function Snapchat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c2.5 0 4.3 1.9 4.4 4.4.03.6 0 1.2-.03 1.8.3.16.66.2 1 .1.2-.06.4-.1.6-.1.5 0 .9.35.9.8 0 .5-.4.75-.9.95-.3.12-.8.25-.95.6-.1.25.03.5.2.8.5.9 1.4 1.7 2.5 2 .3.1.5.3.5.6 0 .5-.8.85-1.7 1.05-.1.25-.15.6-.25.85-.1.2-.25.3-.5.3-.3 0-.65-.1-1.1-.1-.65 0-1 .1-1.5.45-.6.4-1.3.9-2.5.9s-1.9-.5-2.5-.9c-.5-.35-.85-.45-1.5-.45-.45 0-.8.1-1.1.1-.25 0-.4-.1-.5-.3-.1-.25-.15-.6-.25-.85C3.8 17.5 3 17.15 3 16.65c0-.3.2-.5.5-.6 1.1-.3 2-1.1 2.5-2 .17-.3.3-.55.2-.8-.15-.35-.65-.48-.95-.6-.5-.2-.9-.45-.9-.95 0-.45.4-.8.9-.8.2 0 .4.04.6.1.34.1.7.06 1-.1-.03-.6-.06-1.2-.03-1.8C7.7 3.9 9.5 2 12 2Z" />
    </svg>
  );
}

const ICONS: Record<Platform, (p: SVGProps<SVGSVGElement>) => ReactElement> = {
  instagram: Instagram,
  tiktok: TikTok,
  youtube: YouTube,
  twitch: Twitch,
  x: X,
  snapchat: Snapchat,
};

const BASE_URL: Record<Platform, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  twitch: (h) => `https://twitch.tv/${h}`,
  x: (h) => `https://x.com/${h}`,
  snapchat: (h) => `https://snapchat.com/add/${h}`,
};

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = ICONS[platform as Platform];
  return Icon ? <Icon className={className} /> : null;
}

export function socialUrl(platform: string, handle: string, url?: string | null) {
  if (url) return url;
  const fn = BASE_URL[platform as Platform];
  return fn ? fn(handle.replace(/^@/, "")) : "#";
}

export const SOCIAL_PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube", "x", "snapchat", "twitch"];
