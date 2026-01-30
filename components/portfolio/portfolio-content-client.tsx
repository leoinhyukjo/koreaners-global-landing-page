'use client'

import { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import type { Portfolio } from '@/lib/supabase'

interface PortfolioContentClientProps {
  portfolio: Portfolio
  /** 로케일별 본문. 없으면 portfolio.content 사용 */
  content?: any[]
}

export function PortfolioContentClient({ portfolio, content }: PortfolioContentClientProps) {
  const editor = useCreateBlockNote()
  const blocks = content ?? (portfolio?.content && Array.isArray(portfolio.content) ? portfolio.content : [])

  useEffect(() => {
    if (editor) {
      editor.isEditable = false
    }
  }, [editor])

  useEffect(() => {
    if (blocks && Array.isArray(blocks) && editor && blocks.length > 0) {
      try {
        editor.replaceBlocks(editor.document, blocks)
      } catch (error) {
        console.error('Error loading BlockNote content:', error)
      }
    }
  }, [blocks, editor])

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return <p className="text-zinc-200">콘텐츠가 없습니다.</p>
  }

  return <BlockNoteView editor={editor} />
}
