import { ImageResponse } from "next/og";

// Branded link-preview card (Discord / Twitter / Slack / iMessage). 1200×630.
// Rendered once at build time and served as a static PNG, so embeds show the
// lavender brand card instead of a bare text fallback.

export const alt = "MaskedUSD — privacy stablecoin infrastructure on Base";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pull the brand display font (Space Grotesk) as a TTF for Satori. Old-UA trick
// forces Google Fonts to return truetype (not woff2, which Satori can't parse).
// Best-effort: on any failure we fall back to next/og's bundled default font.
async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@${weight}`;
    // A non-browser UA makes Google Fonts return a TTF (browser UAs get woff2,
    // which Satori can't parse). We still accept woff/opentype as a fallback.
    const css = await (await fetch(url, { headers: { "User-Agent": "curl/8.0" } })).text();
    const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/);
    if (!m) return null;
    const res = await fetch(m[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// The domino mask, drawn inline so it rasterizes crisply into the PNG.
function Mask({ width }: { width: number }) {
  return (
    <svg width={width} height={(width * 64) / 120} viewBox="0 0 120 64">
      <path
        d="M14 14 C 8 14, 4 22, 4 32 C 4 46, 14 56, 28 56 L 50 56 C 56 56, 58 50, 60 50 C 62 50, 64 56, 70 56 L 92 56 C 106 56, 116 46, 116 32 C 116 22, 112 14, 106 14 C 96 14, 86 18, 78 22 C 72 25, 66 26, 60 26 C 54 26, 48 25, 42 22 C 34 18, 24 14, 14 14 Z"
        fill="#8b6fe0"
      />
      <ellipse cx="32" cy="34" rx="9" ry="6" fill="#f6f2fb" />
      <ellipse cx="88" cy="34" rx="9" ry="6" fill="#f6f2fb" />
      <ellipse cx="29" cy="32" rx="2.4" ry="1.6" fill="#6b4fcf" />
      <ellipse cx="85" cy="32" rx="2.4" ry="1.6" fill="#6b4fcf" />
    </svg>
  );
}

const CHIPS = ["Base L2", "1:1 USDC reserves", "In-browser proofs"];

export default async function Image() {
  const [bold, mid] = await Promise.all([loadFont(700), loadFont(500)]);
  const fonts = [
    bold && { name: "Space Grotesk", data: bold, weight: 700 as const, style: "normal" as const },
    mid && { name: "Space Grotesk", data: mid, weight: 500 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 500; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "Space Grotesk",
          color: "#1b1438",
          backgroundColor: "#f6f2fb",
          backgroundImage:
            "radial-gradient(900px 520px at 86% 8%, rgba(139,111,224,0.26), rgba(139,111,224,0) 62%), linear-gradient(135deg, #f6f2fb 0%, #efe7f7 100%)",
        }}
      >
        {/* faint oversized mask, painted under the content */}
        <div style={{ position: "absolute", right: -30, bottom: 40, display: "flex", opacity: 0.1 }}>
          <Mask width={560} />
        </div>

        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mask width={70} />
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>MaskedUSD</div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 72,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: -2.5,
          }}
        >
          <div style={{ display: "flex" }}>Privacy stablecoin</div>
          <div style={{ display: "flex" }}>infrastructure on Base.</div>
        </div>

        {/* supporting line */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 28,
            fontSize: 32,
            fontWeight: 500,
            color: "#5a4e7a",
            maxWidth: 880,
          }}
        >
          1:1 USDC-backed&nbsp;
          <span style={{ color: "#6b4fcf" }}>$USDM</span>,&nbsp;shielded by dZK Proof.
        </div>

        {/* footer: chips + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "11px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(27,20,56,0.12)",
                  background: "rgba(255,255,255,0.72)",
                  color: "#5a4e7a",
                  fontSize: 24,
                  fontWeight: 500,
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#6b4fcf" }}>
            maskedusd.com
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
