'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface KineticTextProps {
  text: string
  className?: string
  staggerDelay?: number
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p'
}

export function KineticText({ text, className, staggerDelay = 0.03, as: Tag = 'h1' }: KineticTextProps) {
  const words = text.split(' ')

  return (
    <Tag className={cn('overflow-hidden', className)}>
      <motion.span
        className="inline-flex flex-wrap justify-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: staggerDelay * 4 } },
        }}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-flex overflow-hidden mr-[0.25em]">
            <motion.span
              className="inline-flex"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
              }}
            >
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  variants={{
                    hidden: { y: '100%', opacity: 0 },
                    visible: {
                      y: '0%',
                      opacity: 1,
                      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
