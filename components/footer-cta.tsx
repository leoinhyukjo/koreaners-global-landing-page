'use client'

import React from "react"

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
import { ConsentModal } from '@/components/consent-modal'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2 } from 'lucide-react'

export function FooterCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    message: '',
    privacyConsent: false,
    marketingConsent: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [marketingModalOpen, setMarketingModalOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.privacyConsent) {
      toast({
        title: t('toastRequiredConsent'),
        description: t('toastRequiredConsentDesc'),
        variant: 'destructive',
      })
      return
    }

    if (!formData.name?.trim()) {
      toast({
        title: t('toastInputError'),
        description: t('toastNameRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.company?.trim()) {
      toast({
        title: t('toastInputError'),
        description: t('toastCompanyRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.position?.trim()) {
      toast({
        title: t('toastInputError'),
        description: t('toastPositionRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.email || !formData.email.trim()) {
      toast({
        title: t('toastInputError'),
        description: t('toastEmailRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.email.includes('@')) {
      toast({
        title: t('toastInputError'),
        description: t('toastEmailInvalid'),
        variant: 'destructive',
      })
      return
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
    if (!cleanPhone || cleanPhone.length === 0) {
      toast({
        title: t('toastInputError'),
        description: t('toastPhoneRequired'),
        variant: 'destructive',
      })
      return
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({
        title: t('toastInputError'),
        description: t('toastPhoneInvalid'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.message?.trim()) {
      toast({
        title: t('toastInputError'),
        description: t('toastMessageRequired'),
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      // DB에 저장할 데이터 준비
      // 필드명은 DB 스키마와 정확히 일치해야 합니다.
      const insertData: Record<string, any> = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        position: formData.position.trim(),
        email: formData.email.trim(),
        phone: cleanPhone,
        message: formData.message.trim(),
        privacy_agreement: formData.privacyConsent,
        marketing_agreement: formData.marketingConsent,
      }

      const { data, error } = await supabase.from('inquiries').insert(insertData)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Footer CTA] Error code:', error.code, 'message:', error.message)
        }
        throw error
      }

      // 성공 Dialog 표시
      setSuccessDialogOpen(true)
      
      sonnerToast.success(t('toastSuccessTitle'), {
        description: t('toastSuccessDesc'),
        duration: 5000,
      })

      // Notion에 데이터 저장 (비동기, 실패해도 사용자 경험에 영향 없음)
      try {
        const notionResponse = await fetch('/api/notion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(insertData),
        })

        if (!notionResponse.ok && process.env.NODE_ENV === 'development') {
          const errorData = await notionResponse.json().catch(() => ({}))
          console.error('[Footer CTA] Notion 저장 실패:', notionResponse.status, errorData?.error ?? '')
        }
      } catch (notionError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Footer CTA] Notion 요청 예외:', notionError?.message ?? '')
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Footer CTA] Submit error:', error?.message ?? '')
      }
      
      let errorMessage = t('toastErrorDefault')
      
      if (error) {
        if (error.message) {
          errorMessage = error.message
        }
        
        // Supabase 에러의 경우 details와 hint 추가
        if (error.details) {
          errorMessage += `\n\n상세: ${error.details}`
        }
        if (error.hint) {
          errorMessage += `\n\n힌트: ${error.hint}`
        }
        if (error.code) {
          errorMessage += `\n\n에러 코드: ${error.code}`
        }
      }

      toast({
        title: t('toastErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-24 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 w-full min-w-0 box-border">
      <div className="container mx-auto max-w-7xl w-full min-w-0 box-border">
        <div className="mb-8 sm:mb-12 block">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 break-keep leading-[1.2] tracking-tight block min-h-[1.2em]">
            {t('footerCtaTitle')}
          </h1>
          <p className="text-base sm:text-lg text-zinc-200 leading-[1.5] tracking-tight mb-2 font-medium break-keep max-w-prose block min-h-[1.5em]">
            <span>{t('footerCtaDesc1')}</span>{' '}
            <span>{t('footerCtaDesc2')}</span>{' '}
            <span>{t('footerCtaDesc3')}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0 box-border">
          {/* Name and Company */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="footer-name" className="block text-sm font-bold text-white mb-2">
                {t('formName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="footer-name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder={t('formPlaceholderName')}
              />
            </div>

            <div>
              <label htmlFor="footer-company" className="block text-sm font-bold text-white mb-2">
                {t('formCompany')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="footer-company"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder={t('formPlaceholderCompany')}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="footer-position" className="block text-sm font-bold text-white mb-2">
                {t('formPosition')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="footer-position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder={t('formPlaceholderPosition')}
              />
            </div>

            <div>
              <label htmlFor="footer-email" className="block text-sm font-bold text-white mb-2">
                {t('formEmail')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="footer-email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder="example@domain.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="footer-phone" className="block text-sm font-bold text-white mb-2">
              {t('formPhone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="footer-phone"
              name="phone"
              required
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setFormData({ ...formData, phone: value })
              }}
              className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
              placeholder={t('formPlaceholderPhone')}
            />
            <p className="mt-1.5 text-xs text-zinc-300">
              {t('formPhoneHint')}
            </p>
          </div>

          <div>
            <label htmlFor="footer-message" className="block text-sm font-bold text-white mb-2">
              {t('formMessage')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="footer-message"
              name="message"
              required
              rows={6}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all resize-none"
              placeholder={t('formPlaceholderMessage')}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="footer-privacyConsent"
                name="privacyConsent"
                checked={formData.privacyConsent}
                onChange={handleChange}
                className="w-5 h-5 rounded-none border-2 border-zinc-700/50 bg-zinc-800 checked:bg-white checked:border-white focus:ring-2 focus:ring-white transition-all cursor-pointer shrink-0"
              />
              <label
                htmlFor="footer-privacyConsent"
                className="flex-1 cursor-pointer group"
              >
                <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setPrivacyModalOpen(true)
                    }}
                    className="text-white underline hover:no-underline focus:outline-none"
                  >
                    {t('formPrivacyLabel')}
                  </button>{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="footer-marketingConsent"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="w-5 h-5 rounded-none border-2 border-zinc-700/50 bg-zinc-800 checked:bg-white checked:border-white focus:ring-2 focus:ring-white transition-all cursor-pointer shrink-0"
              />
              <label
                htmlFor="footer-marketingConsent"
                className="flex-1 cursor-pointer group"
              >
                <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setMarketingModalOpen(true)
                    }}
                    className="text-white underline hover:no-underline focus:outline-none"
                  >
                    {t('formMarketingLabel')}
                  </button>
                </span>
              </label>
            </div>
          </div>

          {/* Consent Modals */}
          <ConsentModal
            open={privacyModalOpen}
            onOpenChange={setPrivacyModalOpen}
            type="privacy"
          />
          <ConsentModal
            open={marketingModalOpen}
            onOpenChange={setMarketingModalOpen}
            type="marketing"
          />

          {/* Success Dialog — 밝은 카드 톤, 둥근 모서리·그림자 통일 */}
          <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl text-foreground">
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t('dialogSuccessTitle')}
                </DialogTitle>
                <DialogDescription className="pt-4 text-base leading-relaxed text-muted-foreground">
                  {t('dialogSuccessDesc')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center">
                <Button
                  onClick={() => {
                    setSuccessDialogOpen(false)
                    setFormData({
                      name: '',
                      company: '',
                      position: '',
                      email: '',
                      phone: '',
                      message: '',
                      privacyConsent: false,
                      marketingConsent: false,
                    })
                  }}
                  className="w-full sm:w-auto px-8 font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                >
                  {t('dialogConfirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="text-center pt-4">
            <Button 
              type="submit" 
              disabled={submitting}
              className="px-12 py-6 text-lg font-black rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('formSubmitting') : t('formSubmit')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
