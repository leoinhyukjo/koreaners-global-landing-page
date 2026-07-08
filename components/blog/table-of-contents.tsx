'use client'

import { useEffect, useRef, useState } from 'react'

type Heading = { id: string; text: string }

/**
 * 본문(.blog-content-wrapper) 의 h2 를 스캔해 목차를 만든다.
 * h2 가 3개 이상일 때만, xl 이상에서 우측 sticky 목록으로 노출. 그 외엔 렌더하지 않음.
 * 본문은 dangerouslySetInnerHTML 로 그려지므로 마운트 후 DOM 을 스캔하고 id 를 부여한다.
 */
export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const countRef = useRef(0)

  useEffect(() => {
    const wrapper = document.querySelector('.blog-content-wrapper')
    if (!wrapper) return

    let io: IntersectionObserver | null = null

    const scan = () => {
      const els = Array.from(wrapper.querySelectorAll('h2')) as HTMLHeadingElement[]
      // 헤딩 수 불변이면 재작업 안 함 (id 부여로 인한 재실행 방지 겸 no-op 컷)
      if (els.length === countRef.current) return
      countRef.current = els.length

      if (els.length < 3) {
        setHeadings([])
        io?.disconnect()
        io = null
        return
      }

      const found: Heading[] = els.map((el, i) => {
        if (!el.id) {
          el.id = `toc-heading-${i}`
        }
        return { id: el.id, text: el.textContent?.trim() ?? '' }
      })
      setHeadings(found)

      io?.disconnect()
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActiveId((entry.target as HTMLElement).id)
          }
        },
        { rootMargin: '-20% 0px -70% 0px' },
      )
      els.forEach((el) => io!.observe(el))
    }

    scan()
    // 레거시 BlockNote 등 본문 헤딩이 async 로 나중에 주입되는 경우 재스캔
    // (childList 만 관찰 — attribute(id 부여)는 무시해 루프 방지)
    const mo = new MutationObserver(() => scan())
    mo.observe(wrapper, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io?.disconnect()
    }
  }, [])

  if (headings.length < 3) return null

  return (
    <nav
      aria-label="목차"
      className="hidden xl:block sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#FF4500] font-bold mb-4">CONTENTS</p>
      <ul className="space-y-2 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`block pl-4 -ml-px border-l-2 text-sm leading-snug break-keep transition-colors ${
                activeId === h.id
                  ? 'border-[#FF4500] text-white'
                  : 'border-transparent text-[#A8A29E] hover:text-white'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
