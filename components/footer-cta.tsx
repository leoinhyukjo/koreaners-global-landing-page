'use client'

import React from "react"

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
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

export function FooterCTA() {
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

    // 전화번호 유효성 검사
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
    if (!cleanPhone || cleanPhone.length === 0) {
      toast({
        title: '입력 오류',
        description: '전화번호를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({
        title: '입력 오류',
        description: '올바른 전화번호 형식을 입력해주세요.',
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

      console.log('[Footer CTA] Submitting data:', {
        ...insertData,
        message: insertData.message.substring(0, 50) + '...', // 로그에서 메시지 일부만 표시
      })

      const { data, error } = await supabase.from('inquiries').insert(insertData)

      if (error) {
        // 상세 에러 로깅
        console.error('[Footer CTA] Error details:', JSON.stringify(error, null, 2))
        console.error('[Footer CTA] Error code:', error.code)
        console.error('[Footer CTA] Error message:', error.message)
        console.error('[Footer CTA] Error details:', error.details)
        console.error('[Footer CTA] Error hint:', error.hint)
        throw error
      }

      console.log('[Footer CTA] Success:', data)

      // 성공 Dialog 표시
      setSuccessDialogOpen(true)
      
      // Sonner Toast 표시
      sonnerToast.success('문의가 성공적으로 접수되었습니다!', {
        description: '빠른 시일 내에 연락드리겠습니다.',
        duration: 5000,
      })

      // Notion에 데이터 저장 (비동기, 실패해도 사용자 경험에 영향 없음)
      try {
        console.log('[Footer CTA] Notion API 호출 시작...')
        console.log('[Footer CTA] 전송할 데이터:', {
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

        console.log('[Footer CTA] Notion API 응답 상태:', notionResponse.status)
        console.log('[Footer CTA] Notion API 응답 OK:', notionResponse.ok)

        if (!notionResponse.ok) {
          const errorData = await notionResponse.json()
          console.error('[Footer CTA] ❌ Notion 저장 실패!')
          console.error('[Footer CTA] 에러 상태 코드:', notionResponse.status)
          console.error('[Footer CTA] 에러 데이터:', JSON.stringify(errorData, null, 2))
          // Notion 저장 실패는 로그만 남기고 사용자에게는 알리지 않음
        } else {
          const successData = await notionResponse.json()
          console.log('[Footer CTA] ✅ Notion 저장 성공!')
          console.log('[Footer CTA] 성공 데이터:', JSON.stringify(successData, null, 2))
        }
      } catch (notionError: any) {
        console.error('[Footer CTA] ❌ Notion 저장 중 예외 발생!')
        console.error('[Footer CTA] 에러 타입:', typeof notionError)
        console.error('[Footer CTA] 에러 객체:', notionError)
        console.error('[Footer CTA] 에러 메시지:', notionError?.message)
        console.error('[Footer CTA] 에러 스택:', notionError?.stack)
        // Notion 저장 실패는 로그만 남기고 사용자에게는 알리지 않음
      }
    } catch (error: any) {
      // 상세 에러 로깅
      console.error('[Footer CTA] Catch block error:', JSON.stringify(error, null, 2))
      console.error('[Footer CTA] Error type:', typeof error)
      console.error('[Footer CTA] Error keys:', Object.keys(error || {}))
      
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
    <section className="py-12 sm:py-16 px-4 sm:px-6 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 break-keep">
            CONTACT
          </h1>
          <p className="text-base sm:text-lg text-zinc-200 leading-relaxed mb-2 font-medium break-keep max-w-prose">
            <span className="inline-block">국내·외 크리에이터 네트워크와</span>{' '}
            <span className="inline-block">데이터 기반 전략으로</span>{' '}
            <span className="inline-block">성과를 설계합니다.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name and Company */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="footer-name" className="block text-sm font-bold text-white mb-2">
                성함 <span className="text-white">*</span>
              </label>
              <input
                type="text"
                id="footer-name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder="성함을 입력해주세요."
              />
            </div>

            <div>
              <label htmlFor="footer-company" className="block text-sm font-bold text-white mb-2">
                회사명 <span className="text-white">*</span>
              </label>
              <input
                type="text"
                id="footer-company"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder="회사명을 입력해주세요."
              />
            </div>
          </div>

          {/* Position and Email */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="footer-position" className="block text-sm font-bold text-white mb-2">
                직급 <span className="text-white">*</span>
              </label>
              <input
                type="text"
                id="footer-position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                placeholder="직급을 입력해주세요."
              />
            </div>

            <div>
              <label htmlFor="footer-email" className="block text-sm font-bold text-white mb-2">
                이메일 <span className="text-white">*</span>
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

          {/* Phone */}
          <div>
            <label htmlFor="footer-phone" className="block text-sm font-bold text-white mb-2">
              전화번호 <span className="text-white">*</span>
            </label>
            <input
              type="tel"
              id="footer-phone"
              name="phone"
              required
              value={formData.phone}
              onChange={(e) => {
                // 숫자만 추출 (하이픈, 공백, 기타 문자 제거)
                const value = e.target.value.replace(/[^0-9]/g, '')
                setFormData({ ...formData, phone: value })
              }}
              className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
              placeholder="01012345678 (하이픈 제외)"
            />
            <p className="mt-1.5 text-xs text-zinc-300">
              하이픈(-) 없이 숫자만 입력해주세요. (10-11자리)
            </p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="footer-message" className="block text-sm font-bold text-white mb-2">
              문의내용 <span className="text-white">*</span>
            </label>
            <textarea
              id="footer-message"
              name="message"
              required
              rows={6}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all resize-none"
              placeholder="문의내용을 남겨주세요."
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
                  개인정보 수집 및 이용 동의{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setPrivacyModalOpen(true)
                    }}
                    className="text-white underline hover:no-underline focus:outline-none"
                  >
                    [필수]
                  </button>{' '}
                  <span className="text-white">*</span>
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
                  마케팅 활용 동의{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setMarketingModalOpen(true)
                    }}
                    className="text-white underline hover:no-underline focus:outline-none"
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
            <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-700/50 rounded-none">
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-white/10 rounded-none">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black text-white">
                  상담 신청 완료
                </DialogTitle>
                <DialogDescription className="pt-4 text-base leading-relaxed text-zinc-200">
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
                  className="w-full sm:w-auto px-8 font-black rounded-none"
                >
                  확인
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <Button 
              type="submit" 
              disabled={submitting}
              className="px-12 py-6 text-lg font-black rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '처리 중...' : '무료 상담 신청하기'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
