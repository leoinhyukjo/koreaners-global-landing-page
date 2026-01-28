'use client'

import { useState, useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'

interface BlogEditorWrapperProps {
  initialContent?: any[]
  onContentChange?: (content: any[]) => void
  uploadFile?: (file: File) => Promise<string>
  onEditorReady?: (editor: any) => void
}

export function BlogEditorWrapper({
  initialContent,
  onContentChange,
  uploadFile,
  onEditorReady,
}: BlogEditorWrapperProps) {
  const editor = useCreateBlockNote({
    uploadFile: uploadFile,
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && onEditorReady) {
      onEditorReady(editor)
    }
  }, [isMounted, editor, onEditorReady])

  useEffect(() => {
    if (
      isMounted &&
      initialContent &&
      Array.isArray(initialContent) &&
      initialContent.length > 0 &&
      editor
    ) {
      try {
        editor.replaceBlocks(editor.document, initialContent)
      } catch (err) {
        console.error('Error loading BlockNote content:', err)
      }
    }
  }, [initialContent, editor, isMounted])

  useEffect(() => {
    if (!editor || !onContentChange || !isMounted) return

    const unsubscribe = editor.onChange(() => {
      try {
        onContentChange(editor.document)
      } catch (err) {
        console.error('Error getting editor content:', err)
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, onContentChange, isMounted])

  if (!isMounted) {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">에디터 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="min-h-[600px] editor-light-theme">
        <BlockNoteView editor={editor} theme="light" />
      </div>
    </div>
  )
}
