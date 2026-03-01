'use client'

const PARTNERS_ALL = [
  'BBIA', 'FOODOLOGY', 'INGA', 'Matin Kim', 'medicube', 'MEDI-PEEL', 'MENTHOLOGY', '미쟝센', 'moev', 'OVMENT', 'TREEMINGBIRD', 'WHIPPED', '강남언니', '녹십자웰빙', '뉴트리원', '더멜라닌', '모아씨앤씨', '세예의원', '아비쥬클리닉', '오운의원', '오퓰리크', '와우바이오텍', '플랜에스클리닉', 'BNC KOREA', 'JUVENTA HEALTHCARE', 'KATE의원', 'Onlif', '더북컴퍼니', '미디어앤아트', '바비톡', '바이트랩', '스크럽대디', '인에디트', '코모래비', '트웨니스', 'Hakit', 'The SMC Group', '감자밭', '구미곱창', '논두렁오리주물럭', '맘스피자', '판동면옥', 'Bocado Butter', 'newmix', '가나스윔', 'narka', 'NUMBERING', '네이처리퍼블릭', '뉴베러', '리포데이', 'MAJOURNEE', '블랑디바', '샵한현재', '싱글즈', '아일로', '엔트로피', 'OJOS', '와이낫', '원데이즈유', '정샘물뷰티', '코스노리', 'TNMORPH', "AGE20'S", 'ArteSinsa', 'Biodance', 'BIOHEAL BOH', "d'Alba", 'Dr. Althea', 'Dr. G',
]

const HALF = Math.ceil(PARTNERS_ALL.length / 2)
const PARTNERS_ROW1 = PARTNERS_ALL.slice(0, HALF)
const PARTNERS_ROW2 = PARTNERS_ALL.slice(HALF)

export function TrustSignals() {
  return (
    <div className="bg-black border-y border-white/10 py-4 overflow-hidden">
      {/* Row 1: left-scrolling */}
      <div className="flex whitespace-nowrap [animation:marquee-left_45s_linear_infinite] hover:[animation-play-state:paused]">
        {[...PARTNERS_ROW1, ...PARTNERS_ROW1].map((name, i) => (
          <span key={i} className="mx-4 text-sm font-semibold uppercase text-white/50">
            {name}
          </span>
        ))}
      </div>

      {/* Row 2: right-scrolling */}
      <div className="flex whitespace-nowrap [animation:marquee-right_45s_linear_infinite] hover:[animation-play-state:paused] mt-2">
        {[...PARTNERS_ROW2, ...PARTNERS_ROW2].map((name, i) => (
          <span key={i} className="mx-4 text-sm font-semibold uppercase text-white/50">
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
