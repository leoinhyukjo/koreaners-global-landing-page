'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // 300px 이상 스크롤하면 버튼 표시
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
      setIsExpanded(false)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-8 right-8 z-50"
        >
          {isExpanded ? (
            <motion.div
              initial={{ width: 60, height: 60 }}
              animate={{ width: 'auto', height: 'auto' }}
              className="bg-white text-black rounded-none shadow-2xl p-4 flex items-center gap-3"
            >
              <div className="flex flex-col">
                <span className="font-black text-sm whitespace-nowrap">무료 상담 신청</span>
                <span className="text-xs text-zinc-600">지금 바로 문의하세요</span>
              </div>
              <Button
                onClick={scrollToContact}
                className="bg-black text-white hover:bg-zinc-800 rounded-none font-black px-4"
              >
                신청하기
              </Button>
              <button
                onClick={() => setIsExpanded(false)}
                className="ml-2 p-1 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <Button
              onClick={() => setIsExpanded(true)}
              size="icon"
              className="w-14 h-14 bg-white text-black hover:bg-zinc-100 hover:scale-110 transition-all duration-200 rounded-none shadow-2xl"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
