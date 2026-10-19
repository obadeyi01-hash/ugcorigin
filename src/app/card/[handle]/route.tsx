import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { tierMeta } from "@/lib/tiers";
import { SITE_URL } from "@/components/seo/json-ld";

// The default OG font has no ₦ (U+20A6) glyph, so spell the currency out.
function rateLabel(n: number | null): string {
  return n ? `NGN ${n.toLocaleString("en-US")}` : "On request";
}

// Dynamic, branded PNG of a creator's card, shareable and downloadable, and
// reusable as the profile's social (OG) image. Rendered server-side so the
// photo is fetched without client CORS/canvas limits.

const W = 1200;
const H = 630;

type Card = {
  name: string;
  handle: string;
  location: string | null;
  niches: string[];
  verified: boolean;
  tier: string;
  startingRate: number | null;
  avatarUrl: string | null;
};

const DEMO: Card = {
  name: "Amara O.",
  handle: "demo",
  location: "Lagos, NG",
  niches: ["Beauty & Skincare", "Unboxing", "Testimonials"],
  verified: true,
  tier: "pro",
  startingRate: 45000,
  avatarUrl: "https://images.pexels.com/photos/10375901/pexels-photo-10375901.jpeg?auto=compress&cs=tinysrgb&w=600",
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "U";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function cleanHandle(h: string) {
  return decodeURIComponent(h).replace(/^@/, "").toLowerCase();
}

async function loadCard(handleRaw: string): Promise<Card | null> {
  const handle = cleanHandle(handleRaw);
  if (handle === "demo") return DEMO;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !/^[a-z0-9._-]{3,30}$/.test(handle)) return null;

  const supabase = await createClient();
  const { data: c } = await supabase
    .from("creator_profiles")
    .select("handle, display_name, location, niches, starting_rate_naira, verification_status, tier, avatar_url, is_live")
    .eq("handle", handle)
    .maybeSingle();
  if (!c || !c.is_live) return null;

  return {
    name: c.display_name || `@${c.handle}`,
    handle: c.handle,
    location: c.location,
    niches: c.niches ?? [],
    verified: c.verification_status === "verified",
    tier: c.tier ?? "origin",
    startingRate: c.starting_rate_naira,
    avatarUrl: c.avatar_url,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const card = await loadCard(handle);
  const download = new URL(request.url).searchParams.get("download") === "1";

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=300, s-maxage=300",
  };
  if (download && card) {
    headers["Content-Disposition"] = `attachment; filename="${card.handle}-ugcorigin.png"`;
  }

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: "#141519",
            color: "#f8f8f6",
            fontSize: 44,
            fontFamily: "sans-serif",
          }}
        >
          Creator not found
        </div>
      ),
      { width: W, height: H },
    );
  }

  const tier = tierMeta(card.tier);
  const qr = await QRCode.toDataURL(`${SITE_URL}/@${card.handle}`, {
    margin: 1,
    width: 240,
    color: { dark: "#141519", light: "#ffffff" },
  });

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#141519", color: "#f8f8f6", fontFamily: "sans-serif" }}>
        {/* Photo */}
        <div style={{ display: "flex", width: 450, height: H }}>
          {card.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatarUrl} width={450} height={H} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ display: "flex", width: 450, height: H, alignItems: "center", justifyContent: "center", background: "#ec4899", color: "#fff", fontSize: 180, fontWeight: 800 }}>
              {initials(card.name)}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", padding: "52px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: "#ec4899" }}>UGC</span>
            <span>ORIGIN</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.04 }}>{card.name}</span>
            <span style={{ fontSize: 30, color: "#b9b9b4", marginTop: 10 }}>
              @{card.handle}
              {card.location ? `  ·  ${card.location}` : ""}
            </span>

            <div style={{ display: "flex", marginTop: 22 }}>
              <span style={{ display: "flex", background: "#fce7f3", color: "#db2777", padding: "8px 20px", borderRadius: 999, fontSize: 25, fontWeight: 700 }}>
                {tier.label}
              </span>
              {card.verified && (
                <span style={{ display: "flex", marginLeft: 12, background: "rgba(255,255,255,0.08)", color: "#f8f8f6", padding: "8px 20px", borderRadius: 999, fontSize: 25 }}>
                  Verified Human
                </span>
              )}
            </div>

            <div style={{ display: "flex", marginTop: 22 }}>
              {card.niches.slice(0, 3).map((n) => (
                <span key={n} style={{ display: "flex", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "6px 18px", fontSize: 23, marginRight: 10, color: "#d7d7d3" }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 26 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: "#9a9a95" }}>Starting at</span>
              <span style={{ fontSize: 44, fontWeight: 800 }}>{rateLabel(card.startingRate)}</span>
              <span style={{ fontSize: 24, color: "#b9b9b4", marginTop: 14 }}>ugcorigin.com/@{card.handle}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", padding: 10, background: "#ffffff", borderRadius: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={120} height={120} alt="" />
              </div>
              <span style={{ fontSize: 18, color: "#9a9a95", marginTop: 8 }}>Scan to view</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, headers },
  );
}
