import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { GigWorkspace, type Comment } from "@/components/gigs/gig-workspace";
import { ReviewForm } from "@/components/gigs/review-form";
import { AddVerifiedWork } from "@/components/gigs/add-verified-work";
import { ProductLogistics } from "@/components/gigs/product-logistics";
import { LocationVisit } from "@/components/gigs/location-visit";
import { MeetingScheduler, type Meeting } from "@/components/gigs/meeting-scheduler";
import { OpenDispute } from "@/components/gigs/open-dispute";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { privateUrlFromRef, watermarkedUrlFromRef } from "@/lib/cloudinary-server";
import { fullName } from "@/lib/names";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Gig" };

const DEMO = {
  gig: { id: "demo", title: "3 skincare testimonial videos", status: "in_review", price_naira: 45000, fee_naira: 5400 },
  role: "brand" as const,
  deliverable: {
    id: "d1",
    status: "submitted",
    note: "First cut, raw, watermarked. Let me know the edits!",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  comments: [
    { id: "c1", timecode_secs: 3, body: "Love the hook, can we make it 1s faster?", author: "You" } as Comment,
    { id: "c2", timecode_secs: 9.5, body: "Show the product label clearly here.", author: "You" } as Comment,
  ],
};

async function GigInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === "demo") {
    return <GigWorkspace {...DEMO} />;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: gig } = await supabase
    .from("gigs")
    .select("id, title, status, price_naira, fee_naira, brand_id, creator_id, needs_product, shipping_address, shipping_status, needs_location, location_address, location_status")
    .eq("id", id)
    .maybeSingle();
  if (!gig) return <div className="py-20 text-center text-ink-2">Gig not found.</div>;

  const role: "brand" | "creator" = gig.brand_id === user.id ? "brand" : "creator";

  // A gig means a funded contract, so the two parties can see each other's
  // real name + phone to coordinate (hidden everywhere else until this point).
  const contact = await (async () => {
    const funded = ["funded", "in_progress", "in_review", "revision", "approved", "released", "completed"].includes(gig.status);
    if (!funded) return null;
    if (role === "brand") {
      const { data: c } = await supabase
        .from("creator_profiles")
        .select("display_name, first_name, last_name, phone")
        .eq("id", gig.creator_id)
        .maybeSingle();
      if (!c) return null;
      return { name: fullName({ first: c.first_name, last: c.last_name, display: c.display_name }), phone: c.phone as string | null, who: "creator" as const };
    }
    const { data: b } = await supabase
      .from("brand_profiles")
      .select("company_name, contact_first_name, contact_last_name, phone")
      .eq("id", gig.brand_id)
      .maybeSingle();
    if (!b) return null;
    const contactName = [b.contact_first_name, b.contact_last_name].filter(Boolean).join(" ").trim();
    return { name: b.company_name || "Brand", phone: b.phone as string | null, who: "brand" as const, contactName };
  })();

  const { data: del } = await supabase
    .from("deliverables")
    .select("id, status, note, file_url")
    .eq("gig_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  let deliverable = null as null | { id: string; status: string; note: string | null; videoUrl: string | null };
  let comments: Comment[] = [];

  if (del) {
    let videoUrl: string | null = null;
    if (del.file_url) {
      // New deliverables are Cloudinary authenticated assets ("cld:" ref);
      // legacy ones are paths in the private Supabase "deliverables" bucket.
      // Before approval the brand sees a watermarked preview; the clean file
      // unlocks once the gig is approved/completed.
      const unlocked = del.status === "approved" || ["approved", "released", "completed"].includes(gig.status);
      videoUrl = unlocked ? privateUrlFromRef(del.file_url) : watermarkedUrlFromRef(del.file_url);
      if (!videoUrl) {
        const admin = createAdminClient();
        const { data: signed } = await admin.storage.from("deliverables").createSignedUrl(del.file_url, 3600);
        videoUrl = signed?.signedUrl ?? null;
      }
    }
    deliverable = { id: del.id, status: del.status, note: del.note, videoUrl };

    const { data: cmts } = await supabase
      .from("deliverable_comments")
      .select("id, timecode_secs, body, author_id")
      .eq("deliverable_id", del.id)
      .order("timecode_secs", { ascending: true });

    comments = (cmts ?? []).map((c) => ({
      id: c.id,
      timecode_secs: c.timecode_secs,
      body: c.body,
      author: c.author_id === user.id ? "You" : c.author_id === gig.brand_id ? "Brand" : "Creator",
    }));
  }

  const funded = ["funded", "in_progress", "in_review", "revision", "approved", "released", "completed"].includes(gig.status);
  const { data: meetings } = funded
    ? await supabase
        .from("meetings")
        .select("id, kind, title, scheduled_at, link, notes, status, proposed_by")
        .eq("gig_id", id)
        .order("scheduled_at", { ascending: true })
    : { data: null };

  const [{ data: myReview }, { data: dispute }, { data: featured }] = await Promise.all([
    supabase.from("reviews").select("id").eq("gig_id", id).eq("author_id", user.id).maybeSingle(),
    supabase.from("disputes").select("id, reason, status").eq("gig_id", id).maybeSingle(),
    role === "creator"
      ? supabase.from("profile_videos").select("id").eq("gig_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const disputeOpen = dispute && dispute.status === "open";

  return (
    <>
      <GigWorkspace
        gig={{ id: gig.id, title: gig.title, status: gig.status, price_naira: gig.price_naira, fee_naira: gig.fee_naira }}
        role={role}
        deliverable={deliverable}
        comments={comments}
      />

      <div className="max-w-2xl pb-14">
        {funded && (
          <MeetingScheduler gigId={gig.id} currentUserId={user.id} meetings={(meetings ?? []) as Meeting[]} />
        )}
        {gig.needs_product && funded && (
          <ProductLogistics gigId={gig.id} role={role} address={gig.shipping_address} status={gig.shipping_status} />
        )}
        {gig.needs_location && funded && (
          <LocationVisit gigId={gig.id} role={role} address={gig.location_address} status={gig.location_status} />
        )}
        {contact && (contact.phone || contact.name) && (
          <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Phone className="size-4 text-accent" /> Direct contact
            </p>
            <p className="mt-1 text-sm text-ink-2">
              You&rsquo;re booked, so you can coordinate directly.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="text-ink">
                <span className="text-ink-3">{contact.who === "creator" ? "Creator" : "Brand"}:</span> {contact.name}
                {contact.who === "brand" && contact.contactName ? ` · ${contact.contactName}` : ""}
              </span>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="font-medium text-accent hover:underline">
                  {formatPhone(contact.phone)}
                </a>
              )}
            </div>
          </div>
        )}
        {dispute && (
          <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <AlertTriangle className="size-4 text-error" />
              {disputeOpen ? "Dispute open, under review" : "Dispute resolved"}
            </p>
            {dispute.reason && <p className="mt-2 text-sm text-ink-2">{dispute.reason}</p>}
            <p className="mt-2 text-xs text-ink-3">Our Trust &amp; Safety team decides against the written brief. Escrow stays held until it&apos;s resolved.</p>
          </div>
        )}

        {!dispute && gig.status === "completed" && !myReview && (
          <ReviewForm gigId={id} subjectLabel={role === "brand" ? "the creator" : "the brand"} />
        )}

        {!dispute && gig.status === "completed" && role === "creator" && (
          <div className="mt-6">
            <AddVerifiedWork gigId={id} alreadyFeatured={!!featured} />
          </div>
        )}

        {!dispute && !["completed", "cancelled", "disputed"].includes(gig.status) && (
          <div className="mt-6">
            <OpenDispute gigId={id} />
          </div>
        )}
      </div>
    </>
  );
}

export default function GigPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/"><Logo variant="combined" size={30} /></Link>
          <Link href="/dashboard" className="text-sm font-medium text-ink-2 hover:text-ink">Dashboard</Link>
        </Container>
      </header>
      <Container>
        <Suspense fallback={<div className="py-20" />}>
          <GigInner params={params} />
        </Suspense>
      </Container>
    </>
  );
}
