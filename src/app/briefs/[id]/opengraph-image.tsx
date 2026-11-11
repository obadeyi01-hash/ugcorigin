import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/components/seo/json-ld";

// Per-brief share card, so a brief link (the thing outreach + ads already send)
// previews on WhatsApp/X as a real card instead of plain text. Mirrors the
// creator card route: next/og default font (so "NGN" is spelled out — the font
// has no ₦ glyph), brand symbol inlined, QR to the live brief.

export const alt = "A paid UGC brief on UGCOrigin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

let symbolDataUrl: string | null | undefined;
async function loadSymbol(): Promise<string | null> {
  if (symbolDataUrl !== undefined) return symbolDataUrl;
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "brand", "symbol-white.png"));
    symbolDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    symbolDataUrl = null;
  }
  return symbolDataUrl;
}

function ngn(n: number | null): string {
  return n ? `NGN ${n.toLocaleString("en-US")}` : "Open budget";
}
function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Brief = {
  title: string;
  budget_naira: number | null;
  slots: number;
  deadline: string | null;
  niches: string[] | null;
  status: string;
};

export default async function BriefOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const symbol = await loadSymbol();

  let brief: Brief | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && /^[0-9a-fA-F-]{10,}$/.test(id)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("briefs")
      .select("title, budget_naira, slots, deadline, niches, status")
      .eq("id", id)
      .maybeSingle();
    brief = (data as Brief | null) ?? null;
  }

  const title = brief?.title ?? "Paid UGC briefs, open now";
  const niches = (brief?.niches ?? []).slice(0, 3);
  const deadline = fmtDate(brief?.deadline ?? null);
  const slots = brief?.slots ?? null;
  const facts = [
    slots ? `${slots} creator${slots === 1 ? "" : "s"} needed` : null,
    "Open to all of Nigeria",
    deadline ? `Apply by ${deadline}` : null,
  ].filter(Boolean).join("  ·  ");

  const qr = await QRCode.toDataURL(`${SITE_URL}/briefs/${id}`, {
    margin: 1,
    width: 240,
    color: { dark: "#141519", light: "#ffffff" },
  });

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#141519", color: "#f8f8f6", fontFamily: "sans-serif", padding: 64, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -180, right: -140, width: 620, height: 620, borderRadius: 620, background: "radial-gradient(circle, rgba(219,39,119,0.40), rgba(219,39,119,0))", display: "flex" }} />

        {/* brand + NEW BRIEF */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            {symbol && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={symbol} width={44} height={44} style={{ marginRight: 14 }} alt="" />
            )}
            <span style={{ color: "#ec4899" }}>UGC</span>
            <span>ORIGIN</span>
          </div>
          <span style={{ display: "flex", background: "#db2777", color: "#fff", padding: "10px 24px", borderRadius: 999, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>NEW BRIEF</span>
        </div>

        {/* title */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: title.length > 58 ? 54 : 66, fontWeight: 800, lineHeight: 1.08, maxWidth: 1050 }}>{title}</span>
        </div>

        {/* budget + facts + QR */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginRight: 24 }}>
            <span style={{ fontSize: 24, color: "#9a9a95" }}>Budget per creator</span>
            <span style={{ fontSize: 58, fontWeight: 800 }}>{ngn(brief?.budget_naira ?? null)}</span>
            <span style={{ fontSize: 23, color: "#b9b9b4", marginTop: 10 }}>{facts}</span>
            {niches.length > 0 && (
              <div style={{ display: "flex", marginTop: 18 }}>
                {niches.map((n) => (
                  <span key={n} style={{ display: "flex", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "6px 18px", fontSize: 22, marginRight: 10, color: "#d7d7d3" }}>{n}</span>
                ))}
              </div>
            )}
            <span style={{ fontSize: 24, fontWeight: 700, marginTop: 22 }}>Verified brand. Paid on approval.</span>
            <span style={{ fontSize: 22, color: "#ec4899", marginTop: 4 }}>ugcorigin.com/briefs</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", padding: 10, background: "#fff", borderRadius: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={116} height={116} alt="" />
            </div>
            <span style={{ fontSize: 17, color: "#9a9a95", marginTop: 8 }}>Scan to apply</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
