'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import type { Inquiry } from '@/lib/supabase'

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInquiries()
  }, [])

  async function fetchInquiries() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (error: any) {
      console.error('Error fetching inquiries:', error)
      alert('문의 내역을 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleView(inquiry: Inquiry) {
    setSelectedInquiry(inquiry)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id)

      if (error) throw error
      alert('문의 내역이 삭제되었습니다.')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchInquiries()
    } catch (error: any) {
      console.error('Error deleting inquiry:', error)
      alert('삭제에 실패했습니다: ' + error.message)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase.from('inquiries').delete().in('id', Array.from(selectedIds))

      if (error) throw error
      alert('선택한 문의 내역이 삭제되었습니다.')
      setSelectedIds(new Set())
      fetchInquiries()
    } catch (error: any) {
      console.error('Error bulk deleting inquiries:', error)
      alert('일괄 삭제에 실패했습니다: ' + error.message)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) setSelectedIds(new Set(inquiries.map((i) => i.id)))
    else setSelectedIds(new Set())
  }

  const allSelected = inquiries.length > 0 && selectedIds.size === inquiries.length
  const someSelected = selectedIds.size > 0

  // 문의내용 미리보기 (50자 제한)
  function getMessagePreview(message: string) {
    if (message.length <= 50) return message
    return message.substring(0, 50) + '...'
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl text-white">문의 내역 관리</h1>
        <p className="mt-1 text-sm text-zinc-300 sm:text-base">
          접수된 문의 내역을 확인하고 관리할 수 있습니다
        </p>
      </div>

      {loading ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : inquiries.length === 0 ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          등록된 문의 내역이 없습니다.
        </Card>
      ) : (
        <>
          {/* 일괄 삭제 버튼 */}
          {someSelected && (
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="shrink-0"
              >
                선택 삭제 ({selectedIds.size}건)
              </Button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-zinc-400 hover:text-white underline"
              >
                선택 해제
              </button>
            </div>
          )}

          {/* 데스크톱: 테이블 */}
          <div className="hidden md:block">
            <Card className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(c) => toggleSelectAll(!!c)}
                        aria-label="전체 선택"
                        className="border-2 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                      />
                    </TableHead>
                    <TableHead>인입 시각</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>회사명</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>문의내용</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.map((inquiry) => (
                    <TableRow
                      key={inquiry.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(inquiry)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(inquiry.id)}
                          onCheckedChange={() => toggleSelect(inquiry.id)}
                          aria-label={`${inquiry.name} 선택`}
                          className="border-2 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(inquiry.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{inquiry.name}</TableCell>
                      <TableCell className="text-foreground">{inquiry.company}</TableCell>
                      <TableCell className="text-foreground">{inquiry.phone}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {getMessagePreview(inquiry.message)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-foreground hover:bg-white/10"
                            onClick={() => handleView(inquiry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
                            onClick={() => handleDelete(inquiry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-4 md:hidden">
            {inquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className="rounded-lg border shadow-sm overflow-hidden border-border transition-colors hover:border-primary/30"
                onClick={() => handleView(inquiry)}
              >
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(inquiry.id)}
                            onCheckedChange={() => toggleSelect(inquiry.id)}
                            aria-label={`${inquiry.name} 선택`}
                            className="border-2 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                          />
                        </div>
                        <h3 className="font-semibold leading-snug text-foreground">{inquiry.name}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{inquiry.company}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">전화:</span> {inquiry.phone}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">인입 시각:</span>{' '}
                      {new Date(inquiry.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">문의내용</p>
                      <p className="text-sm leading-relaxed line-clamp-3">
                        {inquiry.message}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(inquiry)}
                      className="min-h-[44px] flex-1 gap-2 touch-manipulation"
                    >
                      <Eye className="h-4 w-4 shrink-0" />
                      상세보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(inquiry.id)}
                      className="min-h-[44px] flex-1 gap-2 text-white border-white/50 hover:bg-white/10 hover:text-white touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 상세보기 다이얼로그 — 화면의 80~90% 너비로 가독성 확보 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={[
            'overflow-y-auto',
            'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
            'inset-0 top-0 left-0 translate-x-0 translate-y-0',
            'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-[90%] md:max-w-[90vw] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:p-6',
          ].join(' ')}
        >
          <DialogHeader>
            <DialogTitle>문의 상세 내역</DialogTitle>
            {selectedInquiry && (
              <DialogDescription>
                {new Date(selectedInquiry.created_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">이름</p>
                  <p className="text-base font-medium">{selectedInquiry.name}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">회사명</p>
                  <p className="text-base font-medium">{selectedInquiry.company}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">직급</p>
                  <p className="text-base font-medium">{selectedInquiry.position}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">전화번호</p>
                  <p className="text-base font-medium">{selectedInquiry.phone}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground">문의내용</p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Badge
                  variant={
                    selectedInquiry.privacy_agreement ||
                    selectedInquiry.privacy_consent ||
                    selectedInquiry.privacy_policy
                      ? 'default'
                      : 'destructive'
                  }
                >
                  개인정보 수집 동의{' '}
                  {selectedInquiry.privacy_agreement ||
                  selectedInquiry.privacy_consent ||
                  selectedInquiry.privacy_policy
                    ? '✓'
                    : '✗'}
                </Badge>
                <Badge
                  variant={
                    selectedInquiry.marketing_agreement || selectedInquiry.marketing_consent
                      ? 'default'
                      : 'outline'
                  }
                >
                  마케팅 활용 동의{' '}
                  {selectedInquiry.marketing_agreement || selectedInquiry.marketing_consent
                    ? '✓'
                    : '✗'}
                </Badge>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
