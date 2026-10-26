"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LayoutDashboard, IdCard, Inbox, BadgeCheck, Settings, LogOut, Megaphone, FileText, MessageSquare, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";
import { Notice } from "@/components/ui/notice";
import { Tooltip } from "@/components/ui/tooltip";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type NavItem = { label: string; href: string };

// A single account can hold a creator profile, a brand profile, or both.
// Capabilities are tracked independently so the menu shows each role's items
// to the accounts that actually hold that role.
type Account = {
  isCreator: boolean;
  isBrand: boolean;
  creatorLive: boolean;
  brandVerified: boolean;
  creatorSuspended: boolean;
  display: string;
  handle: string | null;
  avatarUrl: string | null;
};

function roleLabel(a: Account) {
  if (a.isCreator && a.isBrand) return "Brand + Creator";
  if (a.isCreator) return "Creator";
  if (a.isBrand) return "Brand";
  return "Finish setup";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HeaderClient({ nav }: { nav: NavItem[] }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null); // null = signed out
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setAccount(null);
        setLoading(false);
        return;
      }
      const [{ data: creator }, { data: brand }] = await Promise.all([
        supabase.from("creator_profiles").select("display_name, handle, is_live, suspended").eq("id", user.id).maybeSingle(),
        supabase.from("brand_profiles").select("company_name, logo_url, verification_status").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const isCreator = !!creator;
      const isBrand = !!brand;
      // Prefer the creator identity for the display name/avatar when the
      // account holds both, matching the rest of the app.
      const display = creator?.display_name || creator?.handle || brand?.company_name || user.email?.split("@")[0] || "Account";
      setAccount({
        isCreator,
        isBrand,
        creatorLive: !!creator?.is_live && !creator?.suspended,
        brandVerified: brand?.verification_status === "verified",
        creatorSuspended: !!creator?.suspended,
        display,
        handle: creator?.handle ?? null,
        avatarUrl: isCreator ? null : brand?.logo_url ?? null,
      });
      setLoading(false);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAccount(null);
        setLoading(false);
      } else {
        load();
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const signedIn = !!account;
  const homeHref = signedIn ? "/dashboard" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={homeHref} aria-label="UGCOrigin" className="shrink-0">
          <Logo variant="combined" size={30} />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Reserve space while resolving session to avoid a logged-out flash */}
          {loading ? (
            <span className="size-10 rounded-full bg-surface-2" aria-hidden />
          ) : signedIn ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="u-press flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-2 hover:border-line-strong"
                  aria-label="Account menu"
                  aria-expanded={open}
                >
                  {account!.avatarUrl ? (
                    <Image src={account!.avatarUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">
                      {initials(account!.display)}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 text-ink-3 transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{account!.display}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{roleLabel(account!)}</p>
                    </div>
                    <div className="py-1">
                      <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>Dashboard</MenuLink>
                      <MenuLink href="/messages" icon={MessageSquare} onClick={() => setOpen(false)}>Messages</MenuLink>
                      {account!.isCreator && account!.handle && (
                        <MenuLink href={`/${account!.handle}`} icon={IdCard} onClick={() => setOpen(false)}>View my card</MenuLink>
                      )}
                      {account!.isCreator && (
                        <MenuLink href="/verify" icon={BadgeCheck} onClick={() => setOpen(false)}>Verification</MenuLink>
                      )}
                      {account!.isBrand && (
                        <MenuLink href="/briefs/new" icon={FileText} onClick={() => setOpen(false)}>Post a brief</MenuLink>
                      )}
                      <MenuLink href="/offers" icon={Inbox} onClick={() => setOpen(false)}>Offers</MenuLink>
                      {account!.isBrand && (
                        <MenuLink href="/campaigns" icon={Megaphone} onClick={() => setOpen(false)}>Campaigns</MenuLink>
                      )}
                      {!account!.isCreator && !account!.isBrand && (
                        <MenuLink href="/onboarding" icon={Settings} onClick={() => setOpen(false)}>Complete profile</MenuLink>
                      )}
                      {(account!.isCreator || account!.isBrand) && (
                        <MenuLink href="/settings" icon={Settings} onClick={() => setOpen(false)}>Settings</MenuLink>
                      )}
                    </div>
                    <form action="/auth/signout" method="post" className="border-t border-line">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
                      >
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle — the main nav is hidden below md */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="u-press grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="border-t border-line bg-paper md:hidden">
          <Container className="flex flex-col py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-2 py-3 text-base font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            {!loading && !signedIn && (
              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">Log in</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get started</Button>
                </Link>
              </div>
            )}
          </Container>
        </div>
      )}
      {account?.creatorSuspended && (
        <Container className="pb-3">
          <Notice tone="error" title="This creator profile was taken offline">
            Going through verification again will not undo a moderation takedown.
          </Notice>
        </Container>
      )}
      {account && !account.creatorSuspended && ((account.isCreator && !account.creatorLive) || (account.isBrand && !account.brandVerified)) && (
        <Container className="pb-3">
          <div className="flex flex-wrap items-start gap-2">
            {account.isCreator && !account.creatorLive && (
              <div className="min-w-[16rem] flex-1">
                <Notice tone="warning" title="Creators stay hidden until they are live" href="/verify" action="Finish verification">
                  You cannot apply to briefs or campaigns, and brands cannot find this profile.
                </Notice>
              </div>
            )}
            {account.isBrand && !account.brandVerified && (
              <div className="min-w-[16rem] flex-1">
                <Notice tone="warning" title="Brands cannot post until they are verified" href="/settings" action="Verify your brand">
                  <span className="inline-flex items-center gap-1">
                    Briefs, campaigns, and offers stay closed.
                    <Tooltip label="A person on the team checks the registered business name and CAC/RC number. The badge is what creators see on your posts.">
                      <button type="button" className="font-medium text-ink underline decoration-dotted">Why?</button>
                    </Tooltip>
                  </span>
                </Notice>
              </div>
            )}
          </div>
        </Container>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <Icon className="size-4 text-ink-3" /> {children}
    </Link>
  );
}
