import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, BadgeCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { VideoManager } from "@/components/media/video-manager";
import { TierBadge } from "@/components/ui/tier-badge";
import { BoostButton } from "@/components/boost/boost-button";
import { tierMeta } from "@/lib/tiers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicName } from "@/lib/names";
import { RecommendationsPopup, type RecCreator } from "@/components/dashboard/recommendations-popup";
import { UpsellNudge } from "@/components/upsell/upsell-nudge";
import { VerifyBanner } from "@/components/dashboard/verify-banner";
import { getAdminContext } from "@/lib/admin/rbac";
import { ROLE_LABEL } from "@/lib/admin/roles";
import { loadRateSuggestion } from "@/lib/rates/load";
import { rateMessage } from "@/lib/rates/guides";
import { CopyInviteLink } from "@/components/dashboard/invite-earn";
import { SITE_URL } from "@/components/seo/json-ld";
import { formatNaira } from "@/lib/utils";
import { REFERRAL_HIRE_NAIRA } from "@/lib/referrals/award";

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

/** Shown while the dashboard's data streams in, so the content area keeps the
 *  page frame instead of blanking below the top bar on navigation. */
function DashboardSkeleton() {
  return (
    <>
      <TopBar signedIn={false} />
      <Container className="py-10" role="status" aria-busy="true">
        <span className="sr-only">Loading your dashboard…</span>
        <Skeleton className="h-9 w-56 rounded-lg" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-6 w-40 rounded" />
        <div className="mt-3 grid max-w-2xl gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </Container>
    </>
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

  // Named columns only. phone, bank fields, and rc_number are not selectable
  // by the signed-in role, and select("*") would fail once that migration is applied.
  const [{ data: creator }, { data: brand }] = await Promise.all([
    supabase.from("creator_profiles").select("id, handle, display_name, location, niches, starting_rate_naira, avatar_url, tier, is_live, suspended, completeness, identity_verified, bank_verified, referral_code").eq("id", user.id).maybeSingle(),
    supabase.from("brand_profiles").select("id, company_name, website, verification_status").eq("id", user.id).maybeSingle(),
  ]);

  if (!creator && !brand) redirect("/onboarding");

  let brandNote: string | null = null;
  if (brand && brand.verification_status !== "verified" && brand.verification_status !== "pending") {
    const { data: privateBrand } = await createAdminClient()
      .from("brand_profiles")
      .select("verification_note")
      .eq("id", user.id)
      .maybeSingle();
    brandNote = privateBrand?.verification_note ?? null;
  }

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

  let invited = 0;
  let referralEarned = 0;
  let referralPaid = 0;
  if (creator) {
    const admin = createAdminClient();
    const [{ count }, { data: rewards }] = await Promise.all([
      admin.from("creator_profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id),
      admin.from("referral_rewards").select("amount_naira, status").eq("referrer_id", user.id),
    ]);
    invited = count ?? 0;
    for (const reward of rewards ?? []) {
      referralEarned += reward.amount_naira;
      if (reward.status === "paid") referralPaid += reward.amount_naira;
    }
  }

  // Brand recommendations: a mix of top performers + newly-vetted creators.
  let recs: RecCreator[] = [];
  if (brand) {
    const base = "id, handle, display_name, first_name, last_name, niches, starting_rate_naira, created_at, avatar_url, location, bio, tier";
    const [{ data: top }, { data: fresh }] = await Promise.all([
      supabase.from("creator_profiles").select(base).eq("is_live", true).eq("shadowbanned", false).order("earned_reputation", { ascending: false, nullsFirst: false }).limit(3),
      supabase.from("creator_profiles").select(base).eq("is_live", true).eq("shadowbanned", false).order("created_at", { ascending: false }).limit(4),
    ]);
    const seen = new Set<string>();
    const pick = (rows: typeof top, newbie: boolean) =>
      (rows ?? []).forEach((c) => {
        if (recs.length >= 5 || seen.has(c.id) || !c.handle) return;
        seen.add(c.id);
        recs.push({
          handle: c.handle,
          name: publicName({ first: c.first_name, last: c.last_name, display: c.display_name, handle: c.handle }),
          niches: c.niches ?? [],
          startingRate: c.starting_rate_naira ?? 0,
          newbie,
          image: c.avatar_url ?? null,
          location: c.location ?? null,
          bio: c.bio ?? null,
          tier: c.tier ?? null,
        });
      });
    pick(top, false);
    pick(fresh, true);
  }

  // Premium upsell eligibility. Creators who aren't already Pro get a Creator
  // Pro nudge; brands that haven't verified get a Verified-brand nudge. Shown
  // one at a time (creator first) and frequency-capped client-side.
  let proActive = false;
  if (creator) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .limit(1);
    proActive = !!sub && sub.length > 0;
  }
  const showCreatorPro = !!creator && !proActive;
  const showBrandVerify = !showCreatorPro && !!brand && brand.verification_status !== "verified";
  const adminCtx = await getAdminContext();
  let rateNote: { lead: string; detail: string; stance: string } | null = null;
  if (creator) {
    try {
      const suggestion = await loadRateSuggestion(creator.niches ?? [], creator.location ?? "", creator.tier ?? "origin");
      if (suggestion) rateNote = rateMessage(creator.starting_rate_naira ?? 0, suggestion);
    } catch {
      rateNote = null;
    }
  }

  return (
    <>
      {recs.length > 0 && <RecommendationsPopup creators={recs} />}
      {showCreatorPro && (
        <UpsellNudge
          dismissKey="ugc:upsell:creator-pro"
          eyebrow="Creator Pro"
          title="Get more from your profile"
          body="Unlock extra username changes, a Pro badge that signals you're serious, and priority support, from ₦2,500/mo."
          ctaLabel="See Creator Pro"
          ctaHref="/pro"
        />
      )}
      {showBrandVerify && (
        <UpsellNudge
          dismissKey="ugc:upsell:brand-verify"
          eyebrow="Verified brand"
          title="Win more creators' trust"
          body="Verify your business to earn the Verified brand badge on your offers, verified brands get more (and better) applicants."
          ctaLabel="Verify your brand"
          ctaHref="/settings"
        />
      )}
      <TopBar signedIn />
      <Container className="py-12">
        {creator && !creator.is_live && !creator.suspended && (
          <VerifyBanner
            role="creator"
            href="/verify"
            title="You're not live yet"
            body="Brands can't find this profile until bank, identity, and the agreement are done. We'll email the steps too."
          />
        )}
        {creator?.suspended && (
          <div className="mt-6 max-w-2xl rounded-2xl border border-error/30 bg-error/10 px-4 py-4 text-sm text-ink">
            This creator profile was taken offline by moderation. Going live again won't undo that. Contact support if you think it's a mistake.
          </div>
        )}
        {brand && brand.verification_status !== "verified" && (
          <VerifyBanner
            role="brand"
            href="/settings"
            title={brand.verification_status === "pending" ? "Brand verification is in review" : brandNote ? "Brand verification needs another look" : "Verify your brand"}
            body={brand.verification_status === "pending"
              ? "We have your CAC/RC number. You'll get an email when the badge is on."
              : brandNote
                ? brandNote
                : "A verified business gets a badge on every offer and brief. Submit your CAC/RC number from settings."}
          />
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Welcome{creator?.display_name ? `, ${creator.display_name}` : brand?.company_name ? `, ${brand.company_name}` : ""}.
        </h1>

        {adminCtx && (
          <Card className="mt-6 max-w-2xl border-ink/15">
            <CardBody>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Admin</p>
              <p className="mt-1 font-semibold text-ink">{ROLE_LABEL[adminCtx.role]}</p>
              <p className="mt-1 text-sm text-ink-2">
                Admin tools are a separate workspace on this email. Brand posting, offers, and brand verification stay on the brand profile and do not unlock admin actions.
              </p>
              <Link href="/admin" className="mt-4 inline-block">
                <Button size="sm">Open admin <ArrowRight className="size-4" /></Button>
              </Link>
            </CardBody>
          </Card>
        )}

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
              {!creator.avatar_url && (
                <p className="mt-3 text-sm text-ink-2">
                  Brands see your initials until a profile photo is saved.{" "}
                  <Link href="/settings" className="font-medium text-accent">Add a photo</Link>
                </p>
              )}
              {rateNote && (
                <div className={rateNote.stance === "high" || rateNote.stance === "low" ? "mt-4 rounded-xl bg-warning/10 px-3 py-3" : "mt-4 rounded-xl bg-surface-2 px-3 py-3"}>
                  <p className="text-sm text-ink-2">{rateNote.lead}</p>
                  {rateNote.detail && <p className="mt-1 text-xs text-ink-3">{rateNote.detail}</p>}
                  {rateNote.stance !== "ok" && (
                    <Link href="/settings#starting-rate" className="mt-2 inline-block text-sm font-medium text-accent">Adjust starting rate</Link>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-2 text-sm">
                <p className="flex items-center gap-2 text-ink-2">
                  <BadgeCheck className={creator.identity_verified ? "size-4 text-success" : "size-4 text-ink-3"} />
                  Identity {creator.identity_verified ? "verified" : "not verified, verify to go live"}
                </p>
                <p className="flex items-center gap-2 text-ink-2">
                  <ShieldCheck className={creator.bank_verified ? "size-4 text-success" : "size-4 text-ink-3"} />
                  Bank {creator.bank_verified ? "verified" : "not added, add to receive payouts"}
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

        {creator?.handle && (
          <Card className="mt-6 max-w-2xl">
            <CardBody>
              <p className="font-display font-semibold text-ink">Invite a creator, earn {formatNaira(REFERRAL_HIRE_NAIRA)}</p>
              <p className="mt-1 text-sm text-ink-2">
                When someone joins with your link and a brand hires them, you earn {formatNaira(REFERRAL_HIRE_NAIRA)}. It is paid to your bank, and it is not taken from their rate. You can earn it even if you are not the one hired.
              </p>
              <p className="mt-3 break-all text-xs text-ink-3">{SITE_URL}/signup?role=creator&amp;ref={creator.referral_code || creator.handle}</p>
              <div className="mt-3">
                <CopyInviteLink url={`${SITE_URL}/signup?role=creator&ref=${creator.referral_code || creator.handle}`} />
              </div>
              <p className="mt-3 text-xs text-ink-3">
                {invited} joined with your link · {formatNaira(referralEarned)} earned{referralPaid > 0 ? ` · ${formatNaira(referralPaid)} paid` : ""}
              </p>
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
                <Link href="/saved"><Button size="sm" variant="ghost">Saved</Button></Link>
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
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}
