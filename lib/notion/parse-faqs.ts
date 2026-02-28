/* eslint-disable @typescript-eslint/no-explicit-any */

interface FaqItem {
  question: string
  answer: string
}

/**
 * Extract plain text from a Notion rich_text array.
 */
function plainText(richTexts: any[] | undefined): string {
  if (!richTexts || richTexts.length === 0) return ''
  return richTexts.map((rt: any) => rt.plain_text ?? '').join('')
}

/**
 * Check if the entire paragraph's text is bold.
 * A paragraph is considered "bold" if every non-empty rich_text segment has bold annotation.
 */
function isAllBold(richTexts: any[] | undefined): boolean {
  if (!richTexts || richTexts.length === 0) return false
  const nonEmpty = richTexts.filter(
    (rt: any) => (rt.plain_text ?? '').trim().length > 0,
  )
  if (nonEmpty.length === 0) return false
  return nonEmpty.every((rt: any) => rt.annotations?.bold === true)
}

/**
 * Parse FAQ section from Notion blocks.
 *
 * Looks for a heading_2 containing "FAQ" or "자주 묻는 질문",
 * then parses Q&A pairs where:
 * - Question: bold paragraph or text starting with "Q."
 * - Answer: following non-bold, non-Q paragraphs (concatenated)
 */
export function parseFaqsFromBlocks(blocks: any[]): FaqItem[] {
  if (!blocks || blocks.length === 0) return []

  // Find FAQ section start
  let faqStartIdx = -1
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block?.type !== 'heading_2') continue

    const text = plainText(block.heading_2?.rich_text).toLowerCase()
    if (text.includes('faq') || text.includes('자주 묻는 질문')) {
      faqStartIdx = i + 1
      break
    }
  }

  if (faqStartIdx === -1) return []

  // Parse Q&A pairs from blocks after the FAQ heading
  const faqs: FaqItem[] = []
  let currentQuestion: string | null = null
  let currentAnswerParts: string[] = []

  function flushCurrentFaq() {
    if (currentQuestion) {
      faqs.push({
        question: currentQuestion,
        answer: currentAnswerParts.join(' ').trim(),
      })
    }
    currentQuestion = null
    currentAnswerParts = []
  }

  for (let i = faqStartIdx; i < blocks.length; i++) {
    const block = blocks[i]
    const type = block?.type

    // Stop at next heading_2 or higher (section boundary)
    if (type === 'heading_1' || type === 'heading_2') break

    // Only process paragraphs for Q&A
    if (type !== 'paragraph') continue

    const richTexts = block.paragraph?.rich_text
    const text = plainText(richTexts).trim()
    if (!text) continue

    // Detect question: all-bold text OR starts with "Q."
    const isQuestion = isAllBold(richTexts) || text.startsWith('Q.')

    if (isQuestion) {
      flushCurrentFaq()
      // Strip leading "Q." or "Q. " prefix for cleaner output
      currentQuestion = text.replace(/^Q\.\s*/, '').trim()
    } else if (currentQuestion) {
      // Strip leading "A." or "A. " prefix
      const answerText = text.replace(/^A\.\s*/, '').trim()
      currentAnswerParts.push(answerText)
    }
  }

  // Flush last pair
  flushCurrentFaq()

  return faqs
}
