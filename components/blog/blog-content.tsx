'use client'

import { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import type { BlogPost } from '@/lib/supabase'

interface BlogContentProps {
  blogPost: BlogPost
}

export function BlogContent({ blogPost }: BlogContentProps) {
  const editor = useCreateBlockNote()

  // 에디터를 읽기 전용으로 설정
  useEffect(() => {
    if (editor) {
      editor.isEditable = false
    }
  }, [editor])

  useEffect(() => {
    if (blogPost?.content && Array.isArray(blogPost.content) && editor && blogPost.content.length > 0) {
      try {
        editor.replaceBlocks(editor.document, blogPost.content)
      } catch (err) {
        console.error('Error loading BlockNote content:', err)
      }
    }
  }, [blogPost, editor])

  if (!blogPost?.content || !Array.isArray(blogPost.content) || blogPost.content.length === 0) {
    return <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
  }

  return <BlockNoteView editor={editor} />
}
