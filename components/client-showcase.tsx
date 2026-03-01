'use client'

const CLIENTS_ROW1 = [
  'BBIA', 'FOODOLOGY', 'INGA', 'Matin Kim', 'medicube', 'MEDI-PEEL', 'MENTHOLOGY',
  '미쟝센', 'moev', 'OVMENT', 'TREEMINGBIRD', 'WHIPPED', '강남언니', '녹십자웰빙',
  '뉴트리원', '더멜라닌', '모아씨앤씨', '세예의원', '아비쥬클리닉', '오운의원',
  '오퓰리크', '와우바이오텍', '플랜에스클리닉', 'BNC KOREA', 'JUVENTA HEALTHCARE',
  'KATE의원', 'Onlif', '더북컴퍼니', '미디어앤아트', '바비톡', '바이트랩',
  '스크럽대디', '인에디트', '코모래비', '트웨니스',
]

const CLIENTS_ROW2 = [
  'Hakit', 'The SMC Group', '감자밭', '구미곱창', '논두렁오리주물럭', '맘스피자',
  '판동면옥', 'Bocado Butter', 'newmix', '가나스윔', 'narka', 'NUMBERING',
  '네이처리퍼블릭', '뉴베러', '리포데이', 'MAJOURNEE', '블랑디바', '샵한현재',
  '싱글즈', '아일로', '엔트로피', 'OJOS', '와이낫', '원데이즈유', '정샘물뷰티',
  '코스노리', 'TNMORPH', "AGE20'S", 'ArteSinsa', 'Biodance', 'BIOHEAL BOH',
  "d'Alba", 'Dr. Althea', 'Dr. G',
]

function MarqueeRow({ clients, direction }: { clients: string[]; direction: 'left' | 'right' }) {
  const duplicated = [...clients, ...clients, ...clients]
  const anim = direction === 'left'
    ? '[animation:marquee-left_5s_linear_infinite]'
    : '[animation:marquee-right_5s_linear_infinite]'

  return (
    <div className={`flex whitespace-nowrap ${anim} hover:[animation-play-state:paused]`}>
      {duplicated.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className="shrink-0 mx-2 bg-[#111] border border-white/10 px-6 py-3 hover:border-[#FF4500]/40 transition-colors duration-300"
        >
          <span className="font-display font-bold text-sm text-white uppercase tracking-wider whitespace-nowrap">
            {name}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ClientShowcase() {
  return (
    <section className="bg-[#141414] py-16 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-24 mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">
          TRUSTED BY {CLIENTS_ROW1.length + CLIENTS_ROW2.length}+ BRANDS
        </span>
      </div>

      <div className="space-y-3">
        <MarqueeRow clients={CLIENTS_ROW1} direction="left" />
        <MarqueeRow clients={CLIENTS_ROW2} direction="right" />
      </div>
    </section>
  )
}
