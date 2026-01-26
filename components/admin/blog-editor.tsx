'use client'

import { useCreateBlockNote } from '@blocknote/react'
import type { BlockNoteEditor } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useEffect, useRef } from 'react'

interface BlogEditorProps {
  initialContent?: any[]
  onContentChange?: (content: any[]) => void
  uploadFile?: (file: File) => Promise<string>
  editorRef?: (editor: BlockNoteEditor | null) => void
}

export function BlogEditor({ 
  initialContent, 
  onContentChange, 
  uploadFile,
  editorRef 
}: BlogEditorProps) {
  const editor = useCreateBlockNote({
    uploadFile: uploadFile,
  })
  const initialContentLoadedRef = useRef(false)

  // 에디터 참조를 부모 컴포넌트에 전달
  useEffect(() => {
    if (editorRef) {
      editorRef(editor)
    }
    return () => {
      if (editorRef) {
        editorRef(null)
      }
    }
  }, [editor, editorRef])

  // 초기 콘텐츠 로드 (한 번만 실행)
  useEffect(() => {
    if (
      !initialContentLoadedRef.current &&
      initialContent && 
      Array.isArray(initialContent) && 
      initialContent.length > 0 && 
      editor
    ) {
      try {
        editor.replaceBlocks(editor.document, initialContent)
        initialContentLoadedRef.current = true
      } catch (err) {
        console.error('Error loading BlockNote content:', err)
      }
    }
  }, [initialContent, editor])

  // 콘텐츠 변경 감지 (BlockNote의 onChange 이벤트 사용)
  useEffect(() => {
    if (!editor || !onContentChange) return

    // BlockNote의 onChange는 (editor, { getChanges }) 형태의 콜백을 받습니다
    const unsubscribe = editor.onChange(() => {
      try {
        // editor.document를 통해 현재 콘텐츠를 가져옵니다
        onContentChange(editor.document)
      } catch (err) {
        console.error('Error getting editor content:', err)
      }
    })

    return () => {
      // unsubscribe가 함수인 경우에만 호출
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, onContentChange])

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="min-h-[600px] editor-light-theme">
        <BlockNoteView 
          editor={editor}
          theme="light"
        />
      </div>
    </div>
  )
}
