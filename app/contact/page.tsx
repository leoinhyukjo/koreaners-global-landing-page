'use client'

import React from "react"

import { Navigation } from '@/components/navigation'
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

export default function ContactPage() {
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
    
    // 필수 동의 확인
    if (!formData.privacyConsent) {
      toast({
        title: '필수 동의',
        description: '개인정보 수집 및 이용에 동의해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 이메일 유효성 검사
    if (!formData.email || !formData.email.trim()) {
      toast({
        title: '입력 오류',
        description: '이메일을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    if (!formData.email.includes('@')) {
      toast({
        title: '입력 오류',
        description: '올바른 이메일 형식을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 전화번호: 선택 사항. 입력 시에만 10~11자리 검사
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length > 0 && (cleanPhone.length < 10 || cleanPhone.length > 11)) {
      toast({
        title: '입력 오류',
        description: '올바른 전화번호 형식을 입력해주세요. (10~11자리)',
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

      console.log('[Contact Form] Submitting data:', {
        ...insertData,
        message: insertData.message.substring(0, 50) + '...', // 로그에서 메시지 일부만 표시
      })

      const { data, error } = await supabase.from('inquiries').insert(insertData)

      if (error) {
        // 상세 에러 로깅
        console.error('[Contact Form] Error details:', JSON.stringify(error, null, 2))
        console.error('[Contact Form] Error code:', error.code)
        console.error('[Contact Form] Error message:', error.message)
        console.error('[Contact Form] Error details:', error.details)
        console.error('[Contact Form] Error hint:', error.hint)
        throw error
      }

      console.log('[Contact Form] Success:', data)

      // 성공 Dialog 표시
      setSuccessDialogOpen(true)

      // Notion에 데이터 저장 (비동기, 실패해도 사용자 경험에 영향 없음)
      try {
        console.log('[Contact Form] Notion API 호출 시작...')
        console.log('[Contact Form] 전송할 데이터:', {
          ...insertData,
          message: insertData.message.substring(0, 50) + '...',
        })

        const notionResponse = await fetch('/api/notion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(insertData),
        })

        console.log('[Contact Form] Notion API 응답 상태:', notionResponse.status)
        console.log('[Contact Form] Notion API 응답 OK:', notionResponse.ok)

        if (!notionResponse.ok) {
          const errorData = await notionResponse.json()
          console.error('[Contact Form] ❌ Notion 저장 실패!')
          console.error('[Contact Form] 에러 상태 코드:', notionResponse.status)
          console.error('[Contact Form] 에러 데이터:', JSON.stringify(errorData, null, 2))
          if (errorData?.validationError) {
            console.error('[Contact Form] validation_error — 필드 경로:', errorData.validationError.path, '| 메시지:', errorData.validationError.message)
          }
          if (errorData?.sentPropertyKeys) {
            console.error('[Contact Form] 전송했던 속성 키:', errorData.sentPropertyKeys)
          }
          // Notion 저장 실패는 로그만 남기고 사용자에게는 알리지 않음
        } else {
          const successData = await notionResponse.json()
          console.log('[Contact Form] ✅ Notion 저장 성공!')
          console.log('[Contact Form] 성공 데이터:', JSON.stringify(successData, null, 2))
        }
      } catch (notionError: any) {
        console.error('[Contact Form] ❌ Notion 저장 중 예외 발생!')
        console.error('[Contact Form] 에러 타입:', typeof notionError)
        console.error('[Contact Form] 에러 객체:', notionError)
        console.error('[Contact Form] 에러 메시지:', notionError?.message)
        console.error('[Contact Form] 에러 스택:', notionError?.stack)
        // Notion 저장 실패는 로그만 남기고 사용자에게는 알리지 않음
      }
    } catch (error: any) {
      // 상세 에러 로깅
      console.error('[Contact Form] Catch block error:', JSON.stringify(error, null, 2))
      console.error('[Contact Form] Error type:', typeof error)
      console.error('[Contact Form] Error keys:', Object.keys(error || {}))
      
      // 에러 메시지 구성
      let errorMessage = '신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      
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
        title: '오류 발생',
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
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 break-keep">
              CONTACT
            </h1>
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-2 font-medium break-keep max-w-prose">
              <span className="inline-block">국내·외 크리에이터 네트워크와</span>{' '}
              <span className="inline-block">데이터 기반 전략으로</span>{' '}
              <span className="inline-block">성과를 설계합니다.</span>
            </p>
          </div>

          <div className="bg-card/30 backdrop-blur-sm border-2 border-border rounded-3xl p-6 sm:p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Company */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    성함 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="성함을 입력해주세요."
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    회사명 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="회사명을 입력해주세요."
                  />
                </div>
              </div>

              {/* Position and Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    직급 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="직급을 입력해주세요."
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 break-keep">
                    이메일 <span className="text-primary">*</span>
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

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2 break-keep">
                  전화번호 <span className="text-muted-foreground">(선택)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    // 숫자만 추출 (하이픈, 공백, 기타 문자 제거)
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, phone: value })
                  }}
                  className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="01012345678 (하이픈 제외)"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  하이픈(-) 없이 숫자만 입력해주세요. (10-11자리)
                </p>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2 break-keep">
                  문의내용 <span className="text-primary">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  placeholder="문의내용을 남겨주세요."
                />
              </div>

              {/* Checkboxes */}
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
                      개인정보 수집 및 이용 동의{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setPrivacyModalOpen(true)
                        }}
                        className="text-primary underline hover:no-underline focus:outline-none"
                      >
                        [필수]
                      </button>{' '}
                      <span className="text-primary">*</span>
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
                      마케팅 활용 동의{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setMarketingModalOpen(true)
                        }}
                        className="text-primary underline hover:no-underline focus:outline-none"
                      >
                        [선택]
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
                      상담 신청 완료
                    </DialogTitle>
                    <DialogDescription className="pt-4 text-base leading-relaxed">
                      상담 신청이 정상적으로 접수되었습니다. 담당자가 확인 후 1~2 영업일 내로 연락드리겠습니다. 감사합니다.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="sm:justify-center">
                    <Button
                      onClick={() => {
                        setSuccessDialogOpen(false)
                        // 폼 초기화
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
                      확인
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 py-6 text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,255,0,0.4)] hover:shadow-[0_0_30px_rgba(217,255,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '처리 중...' : '무료 상담 신청하기'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
