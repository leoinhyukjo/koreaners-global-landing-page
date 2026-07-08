'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';
import { getTranslation } from '@/lib/translations';
import { FooterCTA } from '@/components/footer-cta';

/**
 * 인페이지 문의 시트 — 모바일 바텀시트 / 데스크톱 중앙 다이얼로그.
 * 홈 히어로 1차 CTA·StickyCtaBar 가 /contact 이동 대신 이 시트를 연다.
 * 폼은 FooterCTA 를 재사용하되 페이지 하단 FooterCTA(id 접두 consult-form)와
 * DOM id 충돌을 피하려고 instanceId 를 분리한다.
 */
export function InquirySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-border bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-x-auto lg:top-1/2 lg:left-1/2 lg:bottom-auto lg:w-full lg:max-w-3xl lg:max-h-[88vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl"
        >
          <DialogPrimitive.Title className="sr-only">
            {t('heroCtaFreeConsult')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FF4500]/40">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">{t('dialogCancel')}</span>
          </DialogPrimitive.Close>
          <FooterCTA instanceId="inquiry-sheet-form" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
