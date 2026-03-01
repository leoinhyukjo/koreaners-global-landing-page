'use client'

const PHRASE = 'KOREANERS ✦ JAPAN MARKETING SPECIALIST'
const REPEAT = 12

export function TrustSignals() {
  const items = Array.from({ length: REPEAT }, (_, i) => i)

  return (
    <div className="bg-[#141414] overflow-hidden">
      {/* Single-row marquee */}
      <div className="py-4 flex whitespace-nowrap [animation:marquee-left_40s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((i) => (
          <span key={i} className="mx-6 text-sm font-bold uppercase tracking-[0.15em] text-[#FF4500]">
            {PHRASE}
          </span>
        ))}
      </div>

      {/* Orange accent line */}
      <div className="h-[2px] bg-[#FF4500]" />
    </div>
  )
}
