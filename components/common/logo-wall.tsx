// components/common/logo-wall.tsx
// 대표 브랜드 로고 월 (마퀴 캐러셀). 로고 자산: public/logos/, Leo 큐레이션 2026-07-06.
"use client";

type Logo = { slug: string; ext: string; name: string };

// 2행 분할 (상단 좌→우, 하단 우→좌)
const ROW1: Logo[] = [
  { slug: "medipeel", ext: "png", name: "MEDI-PEEL" },
  { slug: "medicube", ext: "png", name: "medicube" },
  { slug: "dalba", ext: "png", name: "d'Alba" },
  { slug: "jungsaemmool", ext: "png", name: "JUNGSAEMMOOL" },
  { slug: "drg", ext: "png", name: "Dr.G" },
  { slug: "biodance", ext: "svg", name: "Biodance" },
  { slug: "gamjabat", ext: "png", name: "감자밭" },
  { slug: "newmix", ext: "svg", name: "newmix" },
  { slug: "ripoday", ext: "jpg", name: "RE4DAY" },
  { slug: "nutrione", ext: "svg", name: "Nutrione" },
];

const ROW2: Logo[] = [
  { slug: "gangnamunni", ext: "svg", name: "강남언니" },
  { slug: "seye", ext: "svg", name: "세예의원" },
  { slug: "abijou", ext: "png", name: "Abijou" },
  { slug: "onlif", ext: "png", name: "Onlif" },
  { slug: "bnc", ext: "png", name: "BNC KOREA" },
  { slug: "scrubdaddy", ext: "svg", name: "Scrub Daddy" },
  { slug: "matinkim", ext: "jpg", name: "Matin Kim" },
  { slug: "treemingbird", ext: "png", name: "TREEMINGBIRD" },
  { slug: "viewmap", ext: "jpg", name: "VIEWMAP" },
  { slug: "ojos", ext: "png", name: "OJOS" },
];

function LogoCard({ logo }: { logo: Logo }) {
  return (
    <div className="flex-shrink-0 w-40 sm:w-48 h-20 sm:h-24 bg-white rounded-xl border border-[var(--kn-dark)]/8 flex items-center justify-center px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/logos/${logo.slug}.${logo.ext}`}
        alt={`${logo.name} 로고`}
        loading="lazy"
        className="max-h-10 sm:max-h-12 max-w-full w-auto object-contain"
      />
    </div>
  );
}

function MarqueeRow({ logos, direction }: { logos: Logo[]; direction: "left" | "right" }) {
  const dup = [...logos, ...logos];
  const anim = direction === "left" ? "marquee-left" : "marquee-right";
  return (
    <div className="overflow-hidden py-2">
      <div className="flex gap-4 w-max" style={{ animation: `${anim} 60s linear infinite` }}>
        {dup.map((logo, i) => (
          <LogoCard key={`${logo.slug}-${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

export function LogoWall() {
  return (
    <section className="bg-[var(--kn-light)] px-0 py-16 overflow-hidden">
      <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--kn-dark)] mb-10 text-center px-6">
        함께한 대표 브랜드
      </h2>
      <div className="space-y-2">
        <MarqueeRow logos={ROW1} direction="left" />
        <MarqueeRow logos={ROW2} direction="right" />
      </div>
    </section>
  );
}
