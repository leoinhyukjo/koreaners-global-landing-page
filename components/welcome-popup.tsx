'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function WelcomePopup() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 쿠키 확인: 팝업을 이미 본 경우 표시하지 않음
    const hasSeenPopup = localStorage.getItem('welcomePopupSeen')
    
    if (!hasSeenPopup) {
      // 3초 후 팝업 표시
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('welcomePopupSeen', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error(t('welcomePopupErrorEmail'))
      return
    }

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('inquiries')
        .insert({
          email: email.trim(),
          message: '웰컴 팝업을 통한 무료 진단 신청',
          privacy_agreement: true,
          marketing_agreement: true,
        })

      if (error) throw error

      toast.success(t('welcomePopupSuccess'), {
        description: t('welcomePopupSuccessDesc'),
      })
      
      handleClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('welcomePopupErrorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-none p-8 relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-white mb-2">
                  {t('welcomePopupTitle1')}
                </h3>
                <h2 className="text-3xl font-black text-white mb-4">
                  {t('welcomePopupTitle2')}
                </h2>
                <p className="text-zinc-300 text-sm">
                  {t('welcomePopupDesc')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder={t('welcomePopupPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white rounded-none"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black hover:bg-zinc-200 rounded-none font-black"
                >
                  {submitting ? t('welcomePopupSubmitting') : t('welcomePopupSubmit')}
                </Button>
              </form>

              <p className="text-xs text-zinc-500 text-center mt-4">
                {t('welcomePopupConsent')}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
