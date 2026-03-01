'use client'

const PHRASES = [
  'YOUR BRAND × JAPAN',
  '300+ CAMPAIGNS',
  '105+ BRAND PARTNERS',
  'DATA-DRIVEN RESULTS',
  'FULL-CYCLE MARKETING',
]

const REPEAT = 4

export function TrustSignals() {
  const items = Array.from({ length: REPEAT }, (_, i) => i)

  return (
    <div className="bg-[#141414] overflow-hidden">
      {/* Single-row marquee — faster, punchier */}
      <div className="py-4 flex whitespace-nowrap [animation:marquee-left_20s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((setIdx) =>
          PHRASES.map((phrase, phraseIdx) => (
            <span key={`${setIdx}-${phraseIdx}`} className="mx-6 text-sm font-bold uppercase tracking-[0.15em] text-[#FF4500]">
              {phrase} ✦
            </span>
          ))
        )}
      </div>

      {/* Orange accent line */}
      <div className="h-[2px] bg-[#FF4500]" />
    </div>
  )
}
