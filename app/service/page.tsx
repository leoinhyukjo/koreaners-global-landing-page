'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, Users, Target, BarChart3, Globe, CheckCircle2, MessageSquare, Database, Shield, Zap, Lightbulb, Brain, GitCompare, Clock, Share2, Bookmark } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const PAIN_DESC_KEYS = ['barrier1Desc', 'barrier2Desc', 'barrier3Desc', 'barrier4Desc'] as const
const INFLUENCER_KEYS = [
  { titleKey: 'serviceInfluencerF1Title' as const, descKey: 'serviceInfluencerF1Desc' as const },
  { titleKey: 'serviceInfluencerF2Title' as const, descKey: 'serviceInfluencerF2Desc' as const },
  { titleKey: 'serviceInfluencerF3Title' as const, descKey: 'serviceInfluencerF3Desc' as const },
] as const
const SEEDING_KEYS = [
  { titleKey: 'serviceSeedingF1Title' as const, descKey: 'serviceSeedingF1Desc' as const },
  { titleKey: 'serviceSeedingF2Title' as const, descKey: 'serviceSeedingF2Desc' as const },
  { titleKey: 'serviceSeedingF3Title' as const, descKey: 'serviceSeedingF3Desc' as const },
] as const

const ServiceSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center pt-24" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
  </div>
)

export default function ServicePage() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const painPoints = [
    { icon: Database, title: 'Data Black-box', descKey: PAIN_DESC_KEYS[0] },
    { icon: Shield, title: 'Trust Barrier', descKey: PAIN_DESC_KEYS[1] },
    { icon: Target, title: 'Lack of Strategy', descKey: PAIN_DESC_KEYS[2] },
    { icon: AlertTriangle, title: 'Operational Risk', descKey: PAIN_DESC_KEYS[3] },
  ]
  const influencerFeatures = INFLUENCER_KEYS.map(({ titleKey, descKey }) => ({ title: t(titleKey), description: t(descKey) }))
  const seedingFeatures = SEEDING_KEYS.map(({ titleKey, descKey }) => ({ title: t(titleKey), description: t(descKey) }))

  const trustMetrics = [
    { number: locale === 'ja' ? '30万' : '30만', label: t('serviceTrustCommunity') },
    { number: '100+', label: t('serviceTrustMedia') },
    { number: '150%', label: t('serviceTrustGrowth') },
    { number: '5,000', label: t('serviceTrustSeeding') },
  ]

  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<ServiceSkeleton />}>
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-24 relative overflow-hidden w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight break-keep break-words">
              <div className="flex flex-col items-center gap-2">
                <span className="inline-block">{t('serviceHero1')}</span>
                <span className="inline-block">
                  <span className="text-white">{t('serviceHero2')}</span>
                  <span className="text-white">{t('serviceHero3')}</span>
                </span>
              </div>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-200 max-w-prose mx-auto text-balance break-keep break-words px-2">
              {t('serviceHeroDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Problem & Insight Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 break-keep break-words">
              {t('serviceProblemTitle')}
            </h2>
            <p className="text-base sm:text-lg text-zinc-200 break-keep break-words max-w-prose mx-auto px-4 sm:px-6 lg:px-24">
              {t('serviceProblemSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((point, index) => (
              <Card 
                key={index}
                className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-500 group min-w-0 overflow-hidden"
              >
                <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-500 shrink-0">
                  <point.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 break-keep break-words pr-1">
                  {point.title}
                </h3>
                <p className="text-zinc-200 leading-relaxed break-words pr-1 min-w-0">
                  {t(point.descKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service 01: Influencer Marketing */}
      <section className="py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-white/10 rounded-none mb-6">
                <span className="text-white font-bold">Service 01</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 break-keep">
                {t('serviceInfluencerTitle')}
              </h2>
              <p className="text-2xl text-white font-bold mb-8 break-keep">
                {t('serviceInfluencerSubtitle')}
              </p>
              
              <div className="space-y-6">
                {influencerFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-none bg-white/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg font-bold text-white mb-2 break-words pr-1">
                        {feature.title}
                      </h4>
                      <p className="text-zinc-200 break-words pr-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-w-0">
              <Card className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 min-w-0 overflow-hidden">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Users className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">105</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceInfluencerStat1')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Target className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">0%</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceInfluencerStat2')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">3</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceInfluencerStat3')}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service 02: Seeding */}
      <section className="py-20 px-4 sm:px-6 lg:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 min-w-0">
              <Card className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 min-w-0 overflow-hidden">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Globe className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">5,000</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceSeedingStat1')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">—</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceSeedingStat2')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-12 h-12 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-4xl font-bold text-white">—</div>
                      <div className="text-sm text-zinc-200 break-words pr-1">{t('serviceSeedingStat3')}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-block px-4 py-2 bg-white/10 rounded-none mb-6">
                <span className="text-white font-bold">Service 02</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 break-keep">
                {t('serviceSeedingTitle')}
              </h2>
              <p className="text-2xl text-white font-bold mb-8 break-keep">
                {t('serviceSeedingSubtitle')}
              </p>
              
              <div className="space-y-6">
                {seedingFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-none bg-white/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2 break-keep">
                        {feature.title}
                      </h4>
                      <p className="text-zinc-200 break-keep">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Reporting Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-24 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800/30 to-zinc-900">
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 break-keep">
              <span className="inline-block">{t('serviceReportTitle1')}</span>{' '}
              <span className="text-white inline-block">{t('serviceReportTitle2')}</span>{' '}
              <span className="inline-block">{t('serviceReportTitle3')}</span>
            </h2>
            <p className="text-lg text-zinc-200 max-w-prose mx-auto leading-relaxed break-keep">
              {t('serviceReportDesc')}
            </p>
          </div>

          <div className="mb-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 break-keep">
                {t('serviceReportSectionTitle')}<span className="text-white">{t('serviceReportSectionTitle2')}</span>
              </h3>
              <p className="text-zinc-200 break-keep">{t('serviceReportSectionDesc')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{t('serviceMetricEfficiency')}</h4>
                    <p className="text-xs text-muted-foreground">{t('serviceMetricEfficiencySub')}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {/* 분석 설명 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t('serviceReportRoasIntro')}</span> {t('serviceReportRoasDesc')}
                    </p>
                  </div>

                  {/* ROAS Metric */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">{t('serviceCampaignRoas')}</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">450%</div>
                      <div className="text-sm text-primary/70 mb-1">+150% ↑</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">{t('serviceCvrLabel')}</div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('serviceQoo10')}</span>
                        <span className="text-sm font-bold text-primary">8.5%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('serviceAmazon')}</span>
                        <span className="text-sm font-bold text-primary/80">7.2%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/80 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('serviceRakuten')}</span>
                        <span className="text-sm font-bold text-primary/60">6.8%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{t('serviceMetricInflow')}</h4>
                    <p className="text-xs text-muted-foreground">{t('serviceMetricInflowSub')}</p>
                  </div>
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t('serviceMetricInflow')}:</span> {t('serviceReportSectionDesc')}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">{t('serviceAvgDwell')}</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">4m 32s</div>
                      <div className="text-sm text-primary/70 mb-1">+85% ↑</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">{t('serviceBounceBySection')}</div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('serviceLandingPage')}</span>
                        <span className="text-sm font-bold text-red-400">28%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400/60 rounded-full" style={{ width: '28%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('serviceDetailPage')}</span>
                        <span className="text-sm font-bold text-orange-400">18%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400/60 rounded-full" style={{ width: '18%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">{t('servicePaymentPage')}</span>
                        <span className="text-sm font-bold text-primary">8%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{t('serviceMetricSpread')}</h4>
                    <p className="text-xs text-muted-foreground">{t('serviceMetricSpreadSub')}</p>
                  </div>
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t('serviceSave')}/{t('serviceShare')}:</span> {t('serviceReportSectionDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Bookmark className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{t('serviceSave')}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">24.5K</div>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{t('serviceShare')}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">18.2K</div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-2">{t('serviceEstimatedRemarketing')}</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">¥8.2M</div>
                      <div className="text-sm text-muted-foreground mb-1">(약 ₩72M)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{t('serviceRemarketingNote')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-zinc-800 border-2 border-zinc-700/50 hover:border-white hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{t('serviceMetricQualitative')}</h4>
                    <p className="text-xs text-muted-foreground">{t('serviceMetricQualitativeSub')}</p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t('serviceMetricQualitative')}:</span> {t('serviceReportSectionDesc')}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{t('serviceTrustCommunity')}: {locale === 'ja' ? '30万+' : '30만+'}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{t('serviceIntentKeyword')}</span>
                        <span>{t('serviceTop5Keywords')}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">{t('serviceKeywordBought')}</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordRepurchase')}</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordRecommend')}</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordSatisfaction')}</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">{t('serviceKeywordEffective')}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{t('serviceBrandImage')}</span>
                        <span>{t('serviceTop5Keywords')}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordTrust')}</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">{t('serviceKeywordPremium')}</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordInnovative')}</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordQuality')}</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">{t('serviceKeywordTrendy')}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{t('serviceLocalSentiment')}</span>
                        <span>{t('serviceJapanReaction')}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">コスパ良い</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">使いやすい</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">リピ決定</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">買ってよかった</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">おすすめ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      </SafeHydration>
    </main>
  )
}
