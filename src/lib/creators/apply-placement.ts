import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { notifyUser } from "@/lib/notify";
import { loadRateSuggestion } from "@/lib/rates/load";
import { tierMeta, type TierKey } from "@/lib/tiers";
import { alignedRate, placementNote } from "@/lib/creators/placement-note";
import { entryTierFromSignals } from "@/lib/tiering/entry-tier";
import { formatNaira } from "@/lib/utils";
import { recordProfileNote } from "@/lib/admin/profile-notes";

type Admin = ReturnType<typeof createAdminClient>;

const ENTRY = ["origin", "rising", "pro"] as const;
type EntryTier = (typeof ENTRY)[number];

function isEntryTier(value: string): value is EntryTier {
  return (ENTRY as readonly string[]).includes(value);
}

export async function placementDefaults(creatorId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("starting_rate_naira, niches, location")
    .eq("id", creatorId)
    .maybeSingle();
  const niches = ((profile?.niches ?? []) as string[]).filter(Boolean);
  const location = (profile?.location ?? "") as string;
  const currentRate = Math.round(profile?.starting_rate_naira ?? 0);
  const typicals = { origin: 0, rising: 0, pro: 0 };
  for (const tier of ENTRY) {
    const suggestion = await loadRateSuggestion(niches, location, tier);
    const band = suggestion ?? { low: tierMeta(tier).floorNaira, typical: tierMeta(tier).floorNaira, high: tierMeta(tier).floorNaira };
    typicals[tier] = alignedRate(currentRate, band, tierMeta(tier).floorNaira).rate;
  }
  const { data: signals } = await admin
    .from("entry_signals")
    .select("verified_followers, prior_work_score, portfolio_count, niche_demand_score")
    .eq("creator_id", creatorId)
    .maybeSingle();
  const placed = entryTierFromSignals({
    followers: signals?.verified_followers ?? 0,
    priorWork: signals?.prior_work_score ?? 0,
    portfolioCount: signals?.portfolio_count ?? 0,
    nicheDemand: signals?.niche_demand_score ?? 0,
  });
  const tier: EntryTier = isEntryTier(placed.tier) ? placed.tier : "origin";
  return {
    tier,
    rate: typicals[tier],
    currentRate,
    typicals,
    summary: `${tierMeta(tier).label} · suggested starting rate ${formatNaira(typicals[tier])}`,
  };
}

/**
 * Set the level and starting rate a reviewer confirmed, then tell the creator
 * in the app and by email. The rate is brought into that level's band when the
 * reviewer does not type a different number.
 */
export async function applyReviewedPlacement(
  admin: Admin,
  creatorId: string,
  review?: { tier?: string; startingRate?: number; actorId?: string },
): Promise<{ error?: string }> {
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("tier, starting_rate_naira, niches, location, first_name, handle")
    .eq("id", creatorId)
    .maybeSingle();
  if (!profile) return { error: "Creator not found." };

  const tier: TierKey = review?.tier && isEntryTier(review.tier) ? review.tier : isEntryTier(profile.tier) ? profile.tier : "origin";
  const floor = tierMeta(tier).floorNaira;
  const niches = (profile.niches ?? []) as string[];
  const location = (profile.location ?? "") as string;
  const suggestion = await loadRateSuggestion(niches, location, tier);
  const band = suggestion ?? { low: floor, typical: floor, high: floor };
  const previous = Math.round(profile.starting_rate_naira ?? 0);
  const explicit = review?.startingRate != null ? Math.round(review.startingRate) : null;
  if (explicit != null && (!Number.isFinite(explicit) || explicit < floor)) {
    return { error: `The starting rate for ${tierMeta(tier).label} can't be under ${floor.toLocaleString("en-NG")}.` };
  }
  const next = explicit != null ? explicit : alignedRate(previous, band, floor).rate;

  const { error } = await admin
    .from("creator_profiles")
    .update({ tier, starting_rate_naira: next })
    .eq("id", creatorId);
  if (error) return { error: error.message };

  const note = placementNote({
    firstName: (profile.first_name as string | null) ?? "",
    tierLabel: tierMeta(tier).label,
    previousRate: previous,
    nextRate: next,
    band,
    niches,
    location,
  });

  await notifyUser(admin, creatorId, {
    type: "placement",
    title: note.heading,
    body: note.body,
    href: "/settings",
    ctaLabel: "Review your profile",
    emailSubject: note.subject,
    skipEmail: true,
  });

  await recordProfileNote(admin, {
    userId: creatorId,
    kind: "placement",
    subject: note.subject,
    body: note.body,
    actorId: review?.actorId,
  });

  if (emailConfigured()) {
    const { data: account } = await admin.from("profiles").select("email").eq("id", creatorId).maybeSingle();
    if (account?.email) {
      await sendEmail({
        to: account.email,
        subject: note.subject,
        heading: note.heading,
        body: note.body,
        bodyHtml: note.bodyHtml,
        preheader: note.preheader,
        ctaLabel: "Review your profile",
        ctaUrl: "/settings",
      });
    }
  }

  return {};
}
