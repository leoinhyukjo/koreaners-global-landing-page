'use client'

import React from "react"

import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ConsentModal } from '@/components/consent-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2 } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const ContactSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center pt-24" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto rounded animate-pulse bg-muted/50" />
  </div>
)

export default function ContactPage() {
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
    if (!formData.email?.trim()) {
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
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({
        title: t('toastInputError'),
        description: cleanPhone.length > 0 ? t('toastPhoneInvalid') : t('toastPhoneRequired'),
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
          console.error('[Contact Form] Error code:', error.code, 'message:', error.message)
        }
        throw error
      }

      // 성공 Dialog 표시
      setSuccessDialogOpen(true)

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
          console.error('[Contact Form] Notion 저장 실패:', notionResponse.status, errorData?.error ?? '')
        }
      } catch (notionError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Contact Form] Notion 요청 예외:', notionError?.message ?? '')
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Contact Form] Submit error:', error?.message ?? '')
      }
      
      // 에러 메시지 구성
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
    <main className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<ContactSkeleton />}>
<section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-24 w-full max-w-full overflow-hidden">
      <div className="container mx-auto max-w-7xl">
          <div className="mb-8 sm:mb-12 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 break-keep break-words">
              {t('footerCtaTitle')}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-foreground leading-relaxed mb-2 font-medium break-keep break-words max-w-prose">
              <span className="inline-block">{t('footerCtaDesc1')}</span>{' '}
              <span className="inline-block">{t('footerCtaDesc2')}</span>{' '}
              <span className="inline-block">{t('footerCtaDesc3')}</span>
            </p>
          </div>

          <div className="bg-card/30 backdrop-blur-sm border-2 border-border rounded-3xl p-6 sm:p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Company */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    {t('formName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={t('formPlaceholderName')}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    {t('formCompany')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={t('formPlaceholderCompany')}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    {t('formPosition')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={t('formPlaceholderPosition')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    {t('formEmail')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2 break-keep">
                  {t('formPhone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, phone: value })
                  }}
                  className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder={t('formPlaceholderPhone')}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('formPhoneHint')}
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2 break-keep">
                  {t('formMessage')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  placeholder={t('formPlaceholderMessage')}
                />
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    name="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-2 border-border bg-background/50 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer shrink-0"
                  />
                  <label
                    htmlFor="privacyConsent"
                    className="flex-1 cursor-pointer group"
                  >
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setPrivacyModalOpen(true)
                        }}
                        className="text-primary underline hover:no-underline focus:outline-none"
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
                    id="marketingConsent"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-2 border-border bg-background/50 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer shrink-0"
                  />
                  <label
                    htmlFor="marketingConsent"
                    className="flex-1 cursor-pointer group"
                  >
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setMarketingModalOpen(true)
                        }}
                        className="text-primary underline hover:no-underline focus:outline-none"
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

              {/* Success Dialog */}
              <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                      {t('dialogSuccessTitle')}
                    </DialogTitle>
                    <DialogDescription className="pt-4 text-base leading-relaxed">
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
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 px-8"
                    >
                      {t('dialogConfirm')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 py-6 text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,255,0,0.4)] hover:shadow-[0_0_30px_rgba(217,255,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('formSubmitting') : t('formSubmit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
      </SafeHydration>
    </main>
  )
}
