import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "UGCOrigin, the creator network for original, human content";
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

// Stylized creator mini-cards — the "real humans" motif (monograms, not real
// faces), so the share image feels like the marketplace, not a flat headline.
// Rates spell out "NGN" — the default OG font has no ₦ (U+20A6) glyph.
const CARDS = [
  { initials: "AO", tint: "#f9a8d4", name: "Beauty · Lagos", rate: "NGN 45k", rot: "-6deg", top: 54 },
  { initials: "CE", tint: "#c4b5fd", name: "Fashion · Abuja", rate: "NGN 60k", rot: "4deg", top: 232 },
  { initials: "ZK", tint: "#99f6e4", name: "Food · Enugu", rate: "NGN 35k", rot: "-3deg", top: 410 },
];

export default async function OgImage() {
  const symbol = await loadSymbol();
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#141519", color: "#f8f8f6", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Soft pink glow for depth */}
        <div style={{ position: "absolute", top: -160, right: -120, width: 620, height: 620, borderRadius: 620, background: "radial-gradient(circle, rgba(219,39,119,0.45), rgba(219,39,119,0))", display: "flex" }} />

        {/* Left: brand + message */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700, padding: 72 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>
            {symbol && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={symbol} width={52} height={52} style={{ marginRight: 16 }} alt="" />
            )}
            <span style={{ color: "#ec4899" }}>UGC</span>
            <span>ORIGIN</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 540 }}>
              Original content from
            </span>
            <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, color: "#ec4899" }}>
              real humans.
            </span>
            <span style={{ fontSize: 28, color: "#b9b9b4", marginTop: 18, maxWidth: 520 }}>
              Hire identity-verified creators. Payment-protected. Nigeria-first.
            </span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {["Payment-protected", "Verified humans", "Next-day payouts"].map((t) => (
              <span key={t} style={{ display: "flex", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "8px 18px", fontSize: 21, color: "#d7d7d3" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: stacked creator mini-cards */}
        <div style={{ display: "flex", position: "relative", width: 500, height: "100%" }}>
          {CARDS.map((c) => (
            <div
              key={c.initials}
              style={{
                position: "absolute",
                top: c.top,
                left: 48,
                display: "flex",
                alignItems: "center",
                width: 388,
                padding: 18,
                borderRadius: 24,
                background: "#1e1f24",
                border: "1px solid rgba(255,255,255,0.08)",
                transform: `rotate(${c.rot})`,
                boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 64, background: c.tint, color: "#141519", fontSize: 26, fontWeight: 800 }}>
                {c.initials}
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 16, flex: 1 }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{c.name}</span>
                <span style={{ fontSize: 18, color: "#9a9a95", marginTop: 4 }}>Starting at</span>
              </div>
              <span style={{ display: "flex", background: "#fce7f3", color: "#db2777", borderRadius: 999, padding: "6px 14px", fontSize: 20, fontWeight: 700 }}>{c.rate}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
