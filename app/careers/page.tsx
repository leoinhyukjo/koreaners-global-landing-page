'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Tv,
  BookOpen,
  Globe,
  Brain,
  Zap,
  Handshake,
  Rocket,
  Calendar,
  FileText,
  ChevronDown,
  Building2,
  Award,
  BarChart3,
  Target,
  TrendingUp,
  Network,
} from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

interface JobPosting {
  id: string
  title: string
  status: string
  startDate: string | null
  note: string
  jdUrl: string | null
  applyUrl: string | null
}

const CareersSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center pt-24" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
  </div>
)

export default function CareersPage() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/careers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data)
        }
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const bizAreas = [
    {
      icon: Users,
      titleKey: 'careersBiz1Title' as const,
      descKey: 'careersBiz1Desc' as const,
      subKeys: ['careersBiz1Sub1' as const, 'careersBiz1Sub2' as const],
    },
    {
      icon: Tv,
      titleKey: 'careersBiz2Title' as const,
      descKey: 'careersBiz2Desc' as const,
      subKeys: ['careersBiz2Sub1' as const, 'careersBiz2Sub2' as const, 'careersBiz2Sub3' as const],
    },
    {
      icon: BookOpen,
      titleKey: 'careersBiz3Title' as const,
      descKey: 'careersBiz3Desc' as const,
      subKeys: ['careersBiz3Sub1' as const, 'careersBiz3Sub2' as const],
    },
  ]

  const strengthItems = [
    { icon: Globe, titleKey: 'careersStrength1Title' as const, descKey: 'careersStrength1Desc' as const },
    { icon: Building2, titleKey: 'careersStrength2Title' as const, descKey: 'careersStrength2Desc' as const },
    { icon: Award, titleKey: 'careersStrength3Title' as const, descKey: 'careersStrength3Desc' as const },
    { icon: BarChart3, titleKey: 'careersStrength4Title' as const, descKey: 'careersStrength4Desc' as const },
  ]

  const visionItems = [
    { titleKey: 'careersVision1Title' as const, descKey: 'careersVision1Desc' as const },
    { titleKey: 'careersVision2Title' as const, descKey: 'careersVision2Desc' as const },
    { titleKey: 'careersVision3Title' as const, descKey: 'careersVision3Desc' as const },
  ]

  const cultureValues = [
    { titleKey: 'careersCulture1Title' as const, descKey: 'careersCulture1Desc' as const, icon: Globe },
    { titleKey: 'careersCulture2Title' as const, descKey: 'careersCulture2Desc' as const, icon: Brain },
    { titleKey: 'careersCulture3Title' as const, descKey: 'careersCulture3Desc' as const, icon: Zap },
    { titleKey: 'careersCulture4Title' as const, descKey: 'careersCulture4Desc' as const, icon: Handshake },
    { titleKey: 'careersCulture5Title' as const, descKey: 'careersCulture5Desc' as const, icon: Rocket },
  ]

  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<CareersSkeleton />}>

        {/* Hero Section */}
        <section className="pt-24 sm:pt-32 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-24 relative overflow-hidden w-full max-w-full">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]" />
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight break-keep">
                JOIN KOREANERS
              </h1>
              <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-zinc-500 to-transparent" />
              <p className="text-xl sm:text-2xl md:text-3xl text-zinc-200 max-w-7xl mx-auto break-keep font-semibold">
                {t('careersHeroSubtitle')}
              </p>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto break-keep">
                {t('careersHeroTitle')}
              </p>
              <div className="pt-2">
                <ChevronDown className="w-6 h-6 text-zinc-500 mx-auto motion-safe:animate-bounce" />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="pt-4 sm:pt-6 pb-8 sm:pb-14 px-4 sm:px-6 lg:px-24 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-sm tracking-widest text-zinc-500 uppercase mb-4">About Us</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-8 break-keep">
                {t('careersAboutTitle')}
              </h2>
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-lg sm:text-xl text-white font-semibold leading-relaxed break-keep">
                  {t('careersAboutDesc1')}
                </p>
                <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed break-keep">
                  {t('careersAboutDesc2')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Business Areas */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Business</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-12 break-keep">
              {t('careersBizTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {bizAreas.map((area, index) => (
                <Card
                  key={index}
                  className="p-6 sm:p-8 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300 group min-w-0 overflow-hidden"
                >
                  <p className="text-xs text-zinc-600 font-mono mb-4">{String(index + 1).padStart(2, '0')}</p>
                  <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
                    <area.icon className="w-8 h-8 text-white group-hover:text-black transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 break-keep">
                    {t(area.titleKey)}
                  </h3>
                  <p className="text-base sm:text-lg text-zinc-300 leading-relaxed break-words mb-5">
                    {t(area.descKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {area.subKeys.map((subKey, subIdx) => (
                      <span key={subIdx} className="inline-flex items-center px-3 py-1.5 bg-white/5 border border-zinc-600 text-sm text-zinc-300 font-medium">
                        {t(subKey)}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Core Strengths */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Strengths</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-12 break-keep">
              {t('careersStrengthTitle')}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {strengthItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 sm:p-6 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 break-keep">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed break-words">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Vision</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-6 break-keep">
              {t('careersVisionTitle')}
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 text-center max-w-3xl mx-auto mb-12 break-keep">
              {t('careersVisionDesc')}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {visionItems.map((item, index) => {
                const icons = [Target, TrendingUp, Network]
                const Icon = icons[index]
                return (
                  <Card
                    key={index}
                    className="p-6 sm:p-8 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300 group text-center"
                  >
                    <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-8 h-8 text-white group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 break-keep">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-base sm:text-lg text-zinc-400 leading-relaxed break-words">
                      {t(item.descKey)}
                    </p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Culture / Talent Section — Alternating Layout */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Culture</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-16 break-keep">
              {t('careersCultureTitle')}
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {cultureValues.map((val, index) => {
                const isEven = index % 2 === 0
                return (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300 ${
                      !isEven ? 'sm:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Number + Icon */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-4xl sm:text-5xl font-black text-zinc-600 select-none leading-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="w-14 h-14 bg-white/10 flex items-center justify-center">
                        <val.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className={`flex-1 ${!isEven ? 'sm:text-right' : ''}`}>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 break-keep">
                        {t(val.titleKey)}
                      </h3>
                      <p className="text-base sm:text-lg text-zinc-400 leading-relaxed break-words">
                        {t(val.descKey)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Job Openings Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <p className="text-xs tracking-widest text-zinc-500 uppercase mb-4">Openings</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 break-keep">
                {t('careersOpeningsTitle')}
              </h2>
              <p className="text-lg sm:text-xl text-zinc-400 break-keep">
                {t('careersOpeningsSubtitle')}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4 max-w-7xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-zinc-800/50 animate-pulse border border-zinc-700/50" />
                ))}
                <p className="text-center text-zinc-400 text-base mt-4">{t('careersLoading')}</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-lg">{t('error')}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-none bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-lg">{t('careersNoOpenings')}</p>
              </div>
            )}

            {/* Job Cards */}
            {!loading && !error && jobs.length > 0 && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {jobs.map((job) => {
                  const isClosed = job.status === '채용완료'
                  return (
                    <Card
                      key={job.id}
                      className={`p-6 sm:p-8 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300 min-w-0 overflow-hidden ${isClosed ? 'opacity-70' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl sm:text-2xl font-bold text-white break-keep">
                              {job.title}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-none shrink-0 ${
                              isClosed
                                ? 'bg-zinc-600 text-zinc-300'
                                : 'bg-white text-black'
                            }`}>
                              {isClosed ? t('careersClosed') : t('careersHiring')}
                            </span>
                          </div>
                          {job.startDate && (
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                              <Calendar className="w-4 h-4 shrink-0" />
                              <span>{job.startDate}</span>
                            </div>
                          )}
                          {job.note && (
                            <p className="text-base text-zinc-300 mt-2 break-words">
                              {job.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {job.jdUrl && (
                            <a href={job.jdUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 font-bold border-zinc-600 text-white hover:bg-zinc-700 hover:text-white">
                                {t('careersDetail')}
                              </Button>
                            </a>
                          )}
                          {isClosed ? (
                            <Button size="lg" className="w-full sm:w-auto px-8 font-black opacity-50 cursor-not-allowed" disabled>
                              {t('careersClosed')}
                            </Button>
                          ) : (
                            <a href={job.applyUrl || 'mailto:leo@koreaners.com'} target="_blank" rel="noopener noreferrer">
                              <Button size="lg" className="w-full sm:w-auto px-8 font-black">
                                {t('careersApply')}
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Fallback CTA */}
            <div className="text-center mt-12 pt-8 border-t border-zinc-800">
              <p className="text-white text-lg font-semibold mb-2">{t('careersNoPositionQuestion')}</p>
              <p className="text-zinc-400 text-base mb-4">{t('careersNoPositionDesc')}</p>
              <a
                href="https://descriptive-wallflower-afd.notion.site/30601ca3e480805196f0dda3f1b0778c?pvs=105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="px-8 font-black">
                  {t('careersNoPositionCta')}
                </Button>
              </a>
            </div>
          </div>
        </section>

      </SafeHydration>
    </main>
  )
}
