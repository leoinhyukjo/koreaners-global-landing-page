'use client'

import React from "react"

import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    phone: '',
    message: '',
    privacyConsent: false,
    marketingConsent: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.privacyConsent) {
      alert('개인정보 수집 및 이용에 동의해주세요.')
      return
    }
    console.log('[v0] Form submitted:', formData)
    alert('무료 상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.')
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
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              CONTACT
            </h1>
            <p className="text-lg text-foreground leading-relaxed mb-2 font-medium">
              글로벌 확장의 첫걸음, 결국 코리너스입니다.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              데이터 기반의 시장 진단부터 성과 설계까지, 마케팅 아키텍트 전문가 그룹이 대기 중입니다.
            </p>
          </div>

          <div className="bg-card/30 backdrop-blur-sm border-2 border-border rounded-3xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Company */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
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
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
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

              {/* Position and Phone */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-foreground mb-2">
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
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    전화번호 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="연락처를 입력해주세요."
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
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
                  placeholder="글로벌 진출 고민을 자유롭게 남겨주세요."
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-2 border-border bg-background/50 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    개인정보 수집 및 이용 동의 [필수] <span className="text-primary">*</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-2 border-border bg-background/50 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    마케팅 활용 동의 [선택]
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 py-6 text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,255,0,0.4)] hover:shadow-[0_0_30px_rgba(217,255,0,0.6)]"
                >
                  무료 상담 시작하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
