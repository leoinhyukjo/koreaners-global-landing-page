import { ImageResponse } from "next/og";

export const runtime = "edge";

async function loadGoogleFont(family: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  }).then((res) => res.text());
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error("Could not resolve font URL from Google Fonts CSS");
  return fetch(match[1]).then((res) => res.arrayBuffer());
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title =
    (searchParams.get("title") || "KOREANERS").slice(0, 120).trim();
  const category =
    (searchParams.get("category") || "CROSS-BORDER MARKETING")
      .slice(0, 40)
      .trim();

  const fontText = `${title}${category}KOREANERS크로스보더 인플루언서 마케팅`;

  try {
    const [sansBold, sansRegular] = await Promise.all([
      loadGoogleFont("Noto+Sans+KR:wght@700", fontText),
      loadGoogleFont("Noto+Sans+KR:wght@400", fontText),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px",
            backgroundColor: "#141414",
            backgroundImage:
              "radial-gradient(circle at 85% 15%, rgba(255,69,0,0.25) 0%, rgba(255,69,0,0) 55%)",
            color: "#ffffff",
            fontFamily: '"NotoSansKR"',
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "32px",
                backgroundColor: "#FF4500",
              }}
            />
            <div
              style={{
                fontSize: 26,
                letterSpacing: "0.22em",
                color: "#FF4500",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          </div>

          <div
            style={{
              fontSize: title.length > 60 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#ffffff",
              display: "flex",
              flexWrap: "wrap",
              wordBreak: "keep-all",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: "28px",
            }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              KOREANERS
            </div>
            <div
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 400,
              }}
            >
              크로스보더 인플루언서 마케팅
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "NotoSansKR", data: sansBold, style: "normal", weight: 700 },
          {
            name: "NotoSansKR",
            data: sansRegular,
            style: "normal",
            weight: 400,
          },
        ],
      },
    );
  } catch (error) {
    console.error("[/api/og] Render failed:", error);
    return new Response("Failed to render OG image", { status: 500 });
  }
}
