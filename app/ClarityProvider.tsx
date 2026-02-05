'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

export default function ClarityProvider() {
  useEffect(() => {
    Clarity.init('vcdon3oki9')
  }, [])

  return null
}

