'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const PARTNERS_ALL = [
  'BBIA', 'FOODOLOGY', 'INGA', 'Matin Kim', 'medicube', 'MEDI-PEEL', 'MENTHOLOGY', '미쟝센', 'moev', 'OVMENT', 'TREEMINGBIRD', 'WHIPPED', '강남언니', '녹십자웰빙', '뉴트리원', '더멜라닌', '모아씨앤씨', '세예의원', '아비쥬클리닉', '오운의원', '오퓰리크', '와우바이오텍', '플랜에스클리닉', 'BNC KOREA', 'JUVENTA HEALTHCARE', 'KATE의원', 'Onlif', '더북컴퍼니', '미디어앤아트', '바비톡', '바이트랩', '스크럽대디', '인에디트', '코모래비', '트웨니스', 'Hakit', 'The SMC Group', '감자밭', '구미곱창', '논두렁오리주물럭', '맘스피자', '판동면옥', 'Bocado Butter', 'newmix', '가나스윔', 'narka', 'NUMBERING', '네이처리퍼블릭', '뉴베러', '리포데이', 'MAJOURNEE', '블랑디바', '샵한현재', '싱글즈', '아일로', '엔트로피', 'OJOS', '와이낫', '원데이즈유', '정샘물뷰티', '코스노리', 'TNMORPH', "AGE20'S", 'ArteSinsa', 'Biodance', 'BIOHEAL BOH', "d'Alba", 'Dr. Althea', 'Dr. G',
]

const ROW_SIZE = 27
const PARTNERS_ROW1 = PARTNERS_ALL.slice(0, ROW_SIZE)
const PARTNERS_ROW2 = PARTNERS_ALL.slice(ROW_SIZE, ROW_SIZE * 2)
const PARTNERS_ROW3 = PARTNERS_ALL.slice(ROW_SIZE * 2)

/** 로고 이미지 경로: public/images/partners/{slug}.png 로 두면 나중에 대체 가능 */
function partnerSlug(name: string): string {
  return name.replace(/\s+/g, '-').replace(/['']/g, '')
}

function PartnerBadge({ name }: { name: string }) {
  const slug = partnerSlug(name)
  return (
    <div
      data-partner={slug}
      className="flex-shrink-0 flex items-center justify-center px-6 py-4 min-w-[140px] sm:min-w-[160px] rounded-lg border border-zinc-700/60 bg-zinc-800/80 opacity-70 hover:opacity-100 hover:border-zinc-500 transition-all duration-200"
    >
      {/* 나중에 로고 이미지 사용 시: <img src={`/images/partners/${slug}.png`} alt={name} className="h-8 object-contain" /> */}
      <span className="text-sm sm:text-base font-semibold text-white text-center truncate max-w-[120px] sm:max-w-[140px]">
        {name}
      </span>
    </div>
  )
}

function MarqueeRow({
  partners,
  direction,
}: {
  partners: string[]
  direction: 'left' | 'right'
}) {
  const duplicated = [...partners, ...partners]
  return (
    <div className="overflow-hidden py-3" aria-hidden>
      <div
        className="flex gap-4 w-max"
        style={{
          animation: direction === 'left' ? 'marquee-left 50s linear infinite' : 'marquee-right 50s linear infinite',
        }}
      >
        {duplicated.map((name, index) => (
          <PartnerBadge key={`${name}-${index}`} name={name} />
        ))}
      </div>
    </div>
  )
}

export function TrustSignals() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  return (
    <section className="py-14 sm:py-20 relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-t border-zinc-700/50 w-full max-w-full">
      <div className="container mx-auto max-w-7xl w-full max-w-full px-4 sm:px-6 overflow-hidden">
        <div className="text-center mb-12 sm:mb-14 block">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 text-white break-keep break-words leading-[1.2] tracking-tight block">
            TRUSTED BY
          </h2>
          <p className="text-zinc-200 text-lg break-keep max-w-prose mx-auto leading-[1.5] tracking-tight block min-h-[1.5em]">
            {t('trustSubtitle')}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <MarqueeRow partners={PARTNERS_ROW1} direction="left" />
          <MarqueeRow partners={PARTNERS_ROW2} direction="right" />
          <MarqueeRow partners={PARTNERS_ROW3} direction="left" />
        </div>

        <div className="mt-14 text-center block">
          <p className="text-sm text-zinc-200 break-keep leading-[1.5] tracking-tight block">
            {t('trustExportVoucher')}
          </p>
        </div>
      </div>
    </section>
  )
}
