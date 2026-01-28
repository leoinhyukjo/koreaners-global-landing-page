'use client'

import { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import type { Portfolio } from '@/lib/supabase'

interface PortfolioContentClientProps {
  portfolio: Portfolio
}

export function PortfolioContentClient({ portfolio }: PortfolioContentClientProps) {
  const editor = useCreateBlockNote()

  // 에디터를 읽기 전용으로 설정
  useEffect(() => {
    if (editor) {
      editor.isEditable = false
    }
  }, [editor])

  useEffect(() => {
    if (portfolio?.content && Array.isArray(portfolio.content) && editor && portfolio.content.length > 0) {
      try {
        editor.replaceBlocks(editor.document, portfolio.content)
      } catch (error) {
        console.error('Error loading BlockNote content:', error)
      }
    }
  }, [portfolio, editor])

  if (!portfolio?.content || !Array.isArray(portfolio.content) || portfolio.content.length === 0) {
    return <p className="text-zinc-200">콘텐츠가 없습니다.</p>
  }

  return <BlockNoteView editor={editor} />
}
