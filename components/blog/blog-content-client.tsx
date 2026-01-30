'use client'

import { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import type { BlogPost } from '@/lib/supabase'

interface BlogContentClientProps {
  blogPost: BlogPost
  /** 로케일별 본문. 없으면 blogPost.content 사용 */
  content?: any[]
}

export function BlogContentClient({ blogPost, content }: BlogContentClientProps) {
  const editor = useCreateBlockNote()
  const blocks = content ?? (blogPost?.content && Array.isArray(blogPost.content) ? blogPost.content : [])

  useEffect(() => {
    if (editor) {
      editor.isEditable = false
    }
  }, [editor])

  useEffect(() => {
    if (blocks && Array.isArray(blocks) && editor && blocks.length > 0) {
      try {
        editor.replaceBlocks(editor.document, blocks)
      } catch (err) {
        console.error('Error loading BlockNote content:', err)
      }
    }
  }, [blocks, editor])

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
  }

  return <BlockNoteView editor={editor} />
}
