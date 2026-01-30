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
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

interface ConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'privacy' | 'marketing'
}

export function ConsentModal({ open, onOpenChange, type }: ConsentModalProps) {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
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
            {isPrivacy ? t('consentPrivacyTitle') : t('consentMarketingTitle')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground break-keep mt-2">
            {isPrivacy ? t('consentPrivacyDesc') : t('consentMarketingDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isPrivacy ? (
            <>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">{t('consentPrivacyPurpose')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentPrivacyPurposeText')}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">{t('consentPrivacyItems')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentPrivacyItemsText')}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">{t('consentPrivacyPeriod')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentPrivacyPeriodText')}
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="font-semibold text-foreground break-keep">{t('consentPrivacyRefusal')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentPrivacyRefusalText')}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">{t('consentMarketingPurpose')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentMarketingPurposeText')}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground break-keep">{t('consentMarketingItems')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-keep">
                  {t('consentMarketingItemsText')}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t('consentAgree')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
