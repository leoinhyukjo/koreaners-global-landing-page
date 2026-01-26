'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'privacy' | 'marketing'
}

export function ConsentModal({ open, onOpenChange, type }: ConsentModalProps) {
  const isPrivacy = type === 'privacy'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          'max-h-[80vh] overflow-y-auto',
          'bg-card border-border',
        ].join(' ')}
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold break-keep">
            {isPrivacy ? '개인정보 수집 및 이용 동의' : '마케팅 활용 동의'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground break-keep mt-2">
            {isPrivacy
              ? '개인정보 수집 및 이용에 대한 상세 내용을 확인해주세요.'
              : '마케팅 정보 수신에 대한 상세 내용을 확인해주세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isPrivacy ? (
            <>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">[수집 및 이용 목적]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  일본·대만 인플루언서 마케팅 캠페인 상담 및 제안
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">[수집 항목]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  성함, 회사명, 직급, 전화번호, 이메일, 문의내용
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">[보유 및 이용 기간]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  문의 접수일로부터 <strong className="text-foreground">1년간</strong> 보관 후 파기합니다.
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="font-semibold text-foreground break-keep">[동의 거부 권리]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  귀하는 개인정보 수집 및 이용에 대해 동의를 거부할 권리가 있습니다. 단, 동의
                  거부 시 상담 신청 및 서비스 제안이 제한될 수 있습니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">[활용 목적]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  일본·대만 시장 최신 마케팅 트렌드 리포트 및 프로모션 안내
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">[활용 항목]</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  성함, 전화번호, 회사명, 이메일 주소
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
