import Link from "next/link";
import { MapPin, ArrowRight, ShieldCheck, Check, Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { PillRow } from "@/components/ui/pill-row";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { TierBadge } from "@/components/ui/tier-badge";
import { SocialIcon, socialUrl } from "@/components/ui/social-icons";
import { ShareCard } from "@/components/marketplace/share-card";
import { StartConversationButton } from "@/components/messages/start-conversation-button";
import { Reviews, type ReviewItem } from "@/components/marketplace/reviews";
import { SocialEmbeds, type EmbedLink } from "@/components/marketplace/social-embeds";
import { CreatorSnapshot, type CreatorMetrics } from "@/components/marketplace/creator-snapshot";
import { SaveButton } from "@/components/marketplace/save-button";
import { ReportButton } from "@/components/moderation/report-button";
import { formatNaira } from "@/lib/utils";
import { formatLabel } from "@/lib/content-formats";

export type ProfileData = {
  id?: string;
  handle: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  niches: string[];
  contentFormats?: string[];
  verified: boolean;
  tier?: string | null;
  influencer?: boolean;
  canSave?: boolean;
  saved?: boolean;
  startingRate?: number | null;
  url: string;
  socials: { platform: string; handle: string; url?: string | null }[];
  socialsLocked?: boolean;
  packages: {
    id: string;
    title: string;
    type: string;
    price_naira: number;
    revisions?: number | null;
    format?: string | null;
  }[];
  reviews: ReviewItem[];
  averageRating: number;
  embeds: EmbedLink[];
  videos?: { id: string; url: string; poster: string | null; verified?: boolean; caption?: string | null }[];
  metrics?: CreatorMetrics;
};

export function CreatorProfile({ data }: { data: ProfileData }) {
  const hasPackages = data.packages.length > 0;

  return (
    <div className="grid gap-10 py-10 md:grid-cols-[1fr_340px]">
      {/* Main */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{data.name}</h1>
          {data.verified && <VerifiedBadge />}
          {data.tier && <TierBadge tier={data.tier} />}
          {data.influencer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent to-[#a855f7] px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="size-3" /> Influencer
            </span>
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-ink-3">
          <MapPin className="size-4" /> {data.location || "Nigeria"} · @{data.handle}
        </p>

        {data.socials.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {data.socials.map((s) =>
              data.socialsLocked ? (
                <span
                  key={s.platform}
                  aria-label={`${s.platform} (unlocks after you book)`}
                  title="Unlocks after you book"
                  className="grid size-10 cursor-default place-items-center rounded-full border border-line bg-surface-2 text-ink-3"
                >
                  <SocialIcon platform={s.platform} className="size-4" />
                </span>
              ) : (
                <a
                  key={s.platform}
                  href={socialUrl(s.platform, s.handle, s.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="u-press grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-accent hover:text-accent"
                >
                  <SocialIcon platform={s.platform} className="size-4" />
                </a>
              ),
            )}
            {data.socialsLocked && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                <ShieldCheck className="size-3.5" /> Socials unlock after you book
              </span>
            )}
          </div>
        )}

        {data.bio && <p className="mt-6 max-w-prose leading-relaxed text-ink-2">{data.bio}</p>}

        {data.metrics && (
          <div className="mt-6">
            <CreatorSnapshot metrics={data.metrics} />
          </div>
        )}

        <PillRow className="mt-6">
          {data.niches.map((n) => <Chip key={n}>{n}</Chip>)}
        </PillRow>

        {data.contentFormats && data.contentFormats.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-3">Offers:</span>
            {data.contentFormats.map((f) => (
              <span key={f} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2">{formatLabel(f)}</span>
            ))}
          </div>
        )}

        {/* Packages */}
        {hasPackages && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-ink">Packages</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {data.packages.map((p) => (
                <Card key={p.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink">{p.title}</h3>
                      <span className="shrink-0 rounded-full bg-accent-tint px-2 py-0.5 text-xs font-medium capitalize text-accent-hover">
                        {p.type}
                      </span>
                    </div>
                    {p.format && <p className="mt-1 text-xs text-ink-3">{p.format}</p>}
                    <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                      {p.revisions != null && (
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-success" /> {p.revisions} revision{p.revisions === 1 ? "" : "s"} included</li>
                      )}
                    </ul>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <p className="font-display text-xl font-bold text-ink">{formatNaira(p.price_naira)}</p>
                      <Link href={`/${data.handle}/hire?title=${encodeURIComponent(p.title)}&price=${p.price_naira}`}>
                        <Button size="sm" variant="secondary">Book</Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {data.videos && data.videos.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-ink">Showcase videos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.videos.map((v) => (
                <figure key={v.id} className="relative">
                  <video
                    src={v.url}
                    poster={v.poster ?? undefined}
                    controls
                    preload="none"
                    playsInline
                    className="aspect-[9/16] w-full rounded-xl border border-line bg-obsidian object-cover"
                  />
                  {v.verified && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  )}
                  {v.caption && <figcaption className="mt-1.5 text-xs text-ink-2">{v.caption}</figcaption>}
                </figure>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-3">
              <ShieldCheck className="mr-1 inline size-3 text-success" />
              Verified clips are real work delivered through UGCOrigin.
            </p>
          </section>
        )}

        <SocialEmbeds links={data.embeds} />

        <Reviews reviews={data.reviews} average={data.averageRating} />

        {data.id && (
          <div className="mt-8 border-t border-line pt-4">
            <ReportButton targetType="profile" targetId={data.id} label="Report this profile" />
          </div>
        )}
      </div>

      {/* Rate card sidebar */}
      <aside>
        <Card className="md:sticky md:top-20">
          <CardBody>
            <p className="text-xs text-ink-3">Starting at</p>
            <p className="font-display text-3xl font-bold text-ink">
              {data.startingRate ? formatNaira(data.startingRate) : ", "}
            </p>

            <Link href={`/${data.handle}/hire`} className="mt-5 block">
              <Button className="w-full">Make an offer <ArrowRight className="size-4" /></Button>
            </Link>
            {data.id && (
              <div className="mt-2">
                <StartConversationButton otherUserId={data.id} label="Message" className="w-full" />
              </div>
            )}
            {data.canSave && data.id && (
              <div className="mt-2">
                <SaveButton creatorId={data.id} initialSaved={data.saved} variant="button" />
              </div>
            )}
            <div className="mt-2">
              <ShareCard url={data.url} name={data.name} handle={data.handle} />
            </div>

            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-ink-2">
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Escrow-protected, pay on approval</li>
              {data.verified && <li className="flex items-center gap-2"><Check className="size-4 text-success" /> Identity-verified human</li>}
            </ul>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
