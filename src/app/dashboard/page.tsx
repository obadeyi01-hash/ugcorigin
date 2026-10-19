import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, BadgeCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { VideoManager } from "@/components/media/video-manager";
import { TierBadge } from "@/components/ui/tier-badge";
import { BoostButton } from "@/components/boost/boost-button";
import { tierMeta } from "@/lib/tiers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="UGCOrigin home">
          <Logo variant="combined" size={30} />
        </Link>
        {signedIn && (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        )}
      </Container>
    </header>
  );
}

async function DashboardInner() {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!configured) {
    return (
      <>
        <TopBar signedIn={false} />
        <Container className="py-20">
          <Card variant="outline" className="mx-auto max-w-md">
            <CardBody className="text-center">
              <h1 className="font-display text-xl font-semibold text-ink">Dashboard</h1>
              <p className="mt-2 text-sm text-ink-2">
                Connect Supabase (add your keys to <code>.env.local</code>) to sign in and see your account.
              </p>
              <Link href="/" className="mt-4 inline-block">
                <Button variant="secondary" size="sm">Back to home</Button>
              </Link>
            </CardBody>
          </Card>
        </Container>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: creator }, { data: brand }] = await Promise.all([
    supabase.from("creator_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("brand_profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  if (!creator && !brand) redirect("/onboarding");

  const { data: gigs } = await supabase
    .from("gigs")
    .select("id, title, status, price_naira")
    .or(`creator_id.eq.${user.id},brand_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: portfolio } = creator
    ? await supabase.from("portfolio_links").select("id, platform, url").eq("creator_id", user.id).order("position", { ascending: true })
    : { data: [] as { id: string; platform: string; url: string }[] };

  const { data: videos } = creator
    ? await supabase.from("profile_videos").select("id, url, poster_url").eq("creator_id", user.id).order("position", { ascending: true })
    : { data: [] as { id: string; url: string; poster_url: string | null }[] };

  return (
    <>
      <TopBar signedIn />
      <Container className="py-12">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Welcome{creator?.display_name ? `, ${creator.display_name}` : brand?.company_name ? `, ${brand.company_name}` : ""}.
        </h1>

        {creator && (
          <Card className="mt-6 max-w-2xl">
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">@{creator.handle}</p>
                    <TierBadge tier={creator.tier} />
                  </div>
                  <p className="text-sm text-ink-3">{creator.location}</p>
                </div>
                <span
                  className={
                    creator.is_live
                      ? "shrink-0 rounded-full bg-success/14 px-2.5 py-1 text-xs font-medium text-success"
                      : "shrink-0 rounded-full bg-warning/14 px-2.5 py-1 text-xs font-medium text-warning"
                  }
                >
                  {creator.is_live ? "Live" : "Pending verification"}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-3">{tierMeta(creator.tier).tagline}</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${creator.completeness ?? 0}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-ink-3">Profile {creator.completeness ?? 0}% complete</p>

              <div className="mt-5 grid gap-2 text-sm">
                <p className="flex items-center gap-2 text-ink-2">
                  <BadgeCheck className={creator.identity_verified ? "size-4 text-success" : "size-4 text-ink-3"} />
                  Identity {creator.identity_verified ? "verified" : ", verify to go live"}
                </p>
                <p className="flex items-center gap-2 text-ink-2">
                  <ShieldCheck className={creator.bank_verified ? "size-4 text-success" : "size-4 text-ink-3"} />
                  Bank {creator.bank_verified ? "verified" : ", add to receive payouts"}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {!creator.is_live && (
                  <Link href="/verify">
                    <Button size="sm">
                      Verify to go live <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/briefs">
                  <Button size="sm" variant="secondary">Find briefs</Button>
                </Link>
                <Link href="/offers">
                  <Button size="sm" variant="ghost">Offers</Button>
                </Link>
                <Link href={`/${creator.handle}`}>
                  <Button size="sm" variant="ghost">View my card</Button>
                </Link>
                {creator.is_live && (
                  <BoostButton targetType="creator" targetId={creator.id} label="Boost my profile" variant="secondary" size="sm" />
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {brand && (
          <Card className="mt-6 max-w-2xl">
            <CardBody>
              <p className="font-semibold text-ink">{brand.company_name}</p>
              {brand.website && <p className="text-sm text-ink-3">{brand.website}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/creators"><Button size="sm">Browse creators <ArrowRight className="size-4" /></Button></Link>
                <Link href="/briefs/new"><Button size="sm" variant="secondary">Post a brief</Button></Link>
                <Link href="/offers"><Button size="sm" variant="ghost">Offers</Button></Link>
              </div>
            </CardBody>
          </Card>
        )}

        {(!creator || !brand) && (
          <Card variant="outline" className="mt-6 max-w-2xl border-dashed">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {creator ? "Also want to hire creators?" : "Also want to earn as a creator?"}
                </p>
                <p className="text-sm text-ink-2">
                  {creator
                    ? "Add a brand account on this same email, kept separate from your creator profile."
                    : "Set up a creator profile on this same email, kept separate from your brand account."}
                </p>
              </div>
              <Link href={creator ? "/onboarding?role=brand" : "/onboarding?role=creator"}>
                <Button size="sm" variant="secondary">
                  {creator ? "Add a brand account" : "Become a creator"} <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardBody>
          </Card>
        )}

        {creator && (
          <div className="mt-6 max-w-2xl">
            <PortfolioManager links={portfolio ?? []} />
            <div className="mt-6">
              <Card><CardBody>
                <VideoManager videos={videos ?? []} />
              </CardBody></Card>
            </div>
          </div>
        )}

        {gigs && gigs.length > 0 && (
          <div className="mt-8 max-w-2xl">
            <h2 className="font-display text-lg font-semibold text-ink">Your gigs</h2>
            <div className="mt-3 grid gap-2">
              {gigs.map((g) => (
                <Link key={g.id} href={`/gigs/${g.id}`} className="u-press flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong">
                  <span className="min-w-0 truncate font-medium text-ink">{g.title}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">{g.status.replace("_", " ")}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<TopBar signedIn={false} />}>
      <DashboardInner />
    </Suspense>
  );
}
