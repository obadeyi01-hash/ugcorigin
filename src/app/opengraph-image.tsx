import { ImageResponse } from "next/og";

export const alt = "UGCOrigin, the creator network for original, human content";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#141519",
          color: "#f8f8f6",
          fontFamily: "sans-serif",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: "#ec4899" }}>UGC</span>
          <span>ORIGIN</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Original content from <span style={{ color: "#ec4899" }}>real humans</span>.
          </span>
          <span style={{ fontSize: 34, color: "#b9b9b4", marginTop: 20, maxWidth: 820 }}>
            Hire identity-verified creators. Escrow-protected. Nigeria-first.
          </span>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#9a9a95" }}>
          ugcorigin.com · A product by Dream Intrepid Ltd.
        </div>
      </div>
    ),
    { ...size },
  );
}
