import type { BlogFAQ } from '@/lib/supabase'

interface BlogFAQSectionProps {
  faqs: BlogFAQ[]
}

export function BlogFAQSection({ faqs }: BlogFAQSectionProps) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section className="mt-10 sm:mt-12 border border-border bg-card px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        자주 묻는 질문 (FAQ)
      </h2>
      <dl className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
            <dt className="text-base lg:text-lg font-semibold text-white/90 mb-2">
              Q. {faq.question}
            </dt>
            <dd className="text-base lg:text-lg text-white/60 leading-relaxed">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
