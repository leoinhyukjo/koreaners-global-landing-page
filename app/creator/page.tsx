'use client'

import { useEffect, useState, Suspense } from 'react'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Users, Instagram, Youtube, Music, Award, Target, X, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Creator } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
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

const CREATORS_PER_PAGE = 12

function CreatorContent() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [allCreators, setAllCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const totalPages = Math.ceil(allCreators.length / CREATORS_PER_PAGE)
  const startIndex = (currentPage - 1) * CREATORS_PER_PAGE
  const endIndex = startIndex + CREATORS_PER_PAGE
  const creators = allCreators.slice(startIndex, endIndex)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    x_url: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)

  useEffect(() => {
    fetchCreators()
  }, [])

  async function fetchCreators() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setAllCreators(data || [])
    } catch (error: any) {
      console.error('Error fetching creators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: t('creatorToastSubmitFail'),
        description: t('creatorToastNameRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.email.trim()) {
      toast({
        title: t('creatorToastSubmitFail'),
        description: t('creatorToastEmailRequired'),
        variant: 'destructive',
      })
      return
    }
    if (!formData.instagram_url.trim()) {
      toast({
        title: t('creatorToastSubmitFail'),
        description: t('creatorToastInstagramRequired'),
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
      const phoneValue = formData.phone.trim() ? cleanPhone : ''

      // Supabase inquiries 테이블에 저장 (type: 'creator_application') — 선택 항목은 빈 문자열 또는 없음으로 전송
      const insertData = {
        name: formData.name.trim() || '',
        email: formData.email.trim() || '',
        phone: phoneValue,
        message: `[${locale === 'ja' ? 'クリエイター申込' : '크리에이터 신청'}]\n\nInstagram: ${formData.instagram_url.trim()}\nYouTube: ${formData.youtube_url?.trim() || (locale === 'ja' ? 'なし' : '없음')}\nTikTok: ${formData.tiktok_url?.trim() || (locale === 'ja' ? 'なし' : '없음')}\nX(Twitter): ${formData.x_url?.trim() || (locale === 'ja' ? 'なし' : '없음')}\n\n${locale === 'ja' ? 'ご要望' : '요청사항'}:\n${formData.message.trim() || (locale === 'ja' ? 'なし' : '없음')}`,
        inquiry_type: 'creator_application',
        privacy_agreement: true,
        marketing_agreement: false,
      }

      const { error: insertError } = await supabase
        .from('inquiries')
        .insert([insertData])

      if (insertError) {
        console.error('Error submitting creator application:', insertError)
        throw insertError
      }

      // 성공 처리
      setSuccessDialogOpen(true)
      
      // 폼 초기화
      setFormData({
        name: '',
        phone: '',
        email: '',
        instagram_url: '',
        youtube_url: '',
        tiktok_url: '',
        x_url: '',
        message: '',
      })
    } catch (error: any) {
      console.error('Error submitting creator application:', error)
      toast({
        title: t('creatorToastSubmitFail'),
        description: t('creatorToastSubmitFailDesc'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-24 w-full max-w-full overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-balance break-words leading-tight">
              <span className="text-white">{t('creatorHero1')}</span>
              <br />
              <span className="text-white">{t('creatorHero2')}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-200 max-w-3xl mx-auto text-pretty break-words px-2">
              {t('creatorHeroDesc')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-zinc-200">{t('loading')}</p>
            </div>
          ) : allCreators.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-200 text-lg">{t('creatorEmpty')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 mb-8 min-w-0">
                {creators.map((creator) => {
                  const instagramHandle = creator.instagram_url
                    ? '@' + creator.instagram_url.replace(/\/$/, '').split('/').pop()
                    : null

                  return (
                    <Card
                      key={creator.id}
                      className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300 min-w-0"
                    >
                      {/* Creator Avatar: 3열 시 비율 유지·축소 */}
                      <div className="aspect-[3/4] min-h-0 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                        {creator.profile_image_url ? (
                          <img
                            src={creator.profile_image_url}
                            alt={creator.name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-primary/30" />
                          </div>
                        )}
                      </div>

                      {/* Creator Info: 3열 모바일 text-xs·overflow-hidden 고정 */}
                      <div className="p-2 md:p-4 min-w-0 overflow-hidden">
                        <div className="mb-1 md:mb-2 flex items-baseline justify-between gap-0.5 min-w-0">
                          <span className="text-[10px] sm:text-xs md:text-base font-bold text-white truncate min-w-0 flex-1" title={instagramHandle || creator.name}>
                            {instagramHandle || creator.name}
                          </span>
                        </div>

                        {/* SNS 링크: 3열 시 아이콘·간격 축소 */}
                        <div className="flex gap-1 sm:gap-1.5 md:gap-2 flex-wrap overflow-hidden">
                          {creator.instagram_url ? (
                            <a
                              href={creator.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 sm:p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors shrink-0"
                              aria-label="Instagram"
                            >
                              <Instagram className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </a>
                          ) : (
                            <div className="p-1 sm:p-1.5 md:p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none shrink-0">
                              <Instagram className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-400" />
                            </div>
                          )}

                          {creator.youtube_url ? (
                            <a
                              href={creator.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 sm:p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors shrink-0"
                              aria-label="YouTube"
                            >
                              <Youtube className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </a>
                          ) : (
                            <div className="p-1 sm:p-1.5 md:p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none shrink-0">
                              <Youtube className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-400" />
                            </div>
                          )}

                          {creator.tiktok_url ? (
                            <a
                              href={creator.tiktok_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 sm:p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors shrink-0"
                              aria-label="TikTok"
                            >
                              <Music className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </a>
                          ) : (
                            <div className="p-1 sm:p-1.5 md:p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none shrink-0">
                              <Music className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-400" />
                            </div>
                          )}

                          {creator.x_url || creator.twitter_url ? (
                            <a
                              href={creator.x_url || creator.twitter_url || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 sm:p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors shrink-0"
                              aria-label="X (Twitter)"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </a>
                          ) : (
                            <div className="p-1 sm:p-1.5 md:p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none shrink-0">
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
                {/* 업데이트 중 플레이스홀더 카드 2개 - 마지막 페이지에만 노출 */}
                {currentPage === totalPages && [1, 2].map((i) => (
                  <Card
                    key={`placeholder-${i}`}
                    className="overflow-hidden bg-zinc-800/40 border border-dashed border-zinc-600/60 opacity-60 pointer-events-none min-w-0"
                  >
                    <div className="aspect-[3/4] bg-zinc-800/50 relative flex items-center justify-center min-h-0">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-zinc-500" />
                    </div>
                    <div className="p-2 md:p-4 h-[64px] sm:h-[72px] md:h-[88px]" />
                  </Card>
                ))}
              </div>

              {/* Pagination - 크리에이터 카드 바로 밑으로 이동 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-12 sm:mb-20">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // 현재 페이지 주변 2페이지씩만 표시
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          onClick={() => router.push(`/creator?page=${page}`)}
                          className={`rounded-none min-w-[44px] ${
                            page === currentPage
                              ? 'bg-white text-black hover:bg-white'
                              : 'border-zinc-700/50 bg-zinc-800 text-white hover:bg-white hover:text-black hover:border-white'
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-zinc-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              )}
              {/* 하단 멘트 및 그라데이션 - 마지막 페이지에만 노출 */}
              {currentPage === totalPages && (
                <div className="text-center py-12 mt-8 sm:mt-12">
                  <p className="text-zinc-500 text-sm sm:text-base italic">
                    {t('creatorUpdating')}
                  </p>
                  <div className="mt-4 h-12 bg-gradient-to-b from-transparent to-zinc-900/80 pointer-events-none" aria-hidden />
                </div>
              )}
            </>
          )}

          {/* Creator Categories */}
          <div className="mb-20">
            <h2 className="text-3xl font-black text-center mb-12 text-white">
              <span className="text-white">{t('creatorPoolTitle1')}</span>
              <span className="text-white">{t('creatorPoolTitle2')}</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">{t('creatorPlatformExpertise')}</h3>
                <ul className="space-y-3 text-zinc-200">
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">Instagram:</span> {t('creatorPlatformIg')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">TikTok:</span> {t('creatorPlatformTiktok')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">YouTube:</span> {t('creatorPlatformYoutube')}</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">{t('creatorDemographicTitle')}</h3>
                <ul className="space-y-3 text-zinc-200">
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">{t('creatorDemographicLabel10s')}:</span> {t('creatorDemographic10s')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">{t('creatorDemographicLabel20s')}:</span> {t('creatorDemographic20s')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">{t('creatorDemographicLabel30s')}:</span> {t('creatorDemographic30s')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">{t('creatorDemographicLabelMale')}:</span> {t('creatorDemographicMale')}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-black text-center mb-12 text-white">
              <span className="text-white">{t('creatorDifferentiatorTitle1')}</span>
              <span className="text-white">{t('creatorDifferentiatorTitle2')}</span>
            </h2>

            <div className="space-y-6">
              <Card className="p-8 bg-zinc-800 border-zinc-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-none">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">{t('creatorQualityTitle')}</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      {t('creatorQualityDesc')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-zinc-800 border-zinc-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-none">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">{t('creatorExplainTitle')}</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      {t('creatorExplainDesc')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-zinc-800 border-zinc-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-none">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">{t('creatorLocalTitle')}</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      {t('creatorLocalDesc')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Creator Application Form */}
          <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-24 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 mb-20 w-full max-w-full overflow-hidden">
            <div className="container mx-auto max-w-7xl">
              <div className="mb-6 sm:mb-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 break-keep">
                  {t('creatorApplyTitle')}
                </h1>
                <p className="text-base sm:text-lg text-zinc-200 leading-relaxed mb-2 font-medium break-keep max-w-prose">
                  <span className="inline-block">{t('creatorApplyDesc1')}</span>{' '}
                  <span className="inline-block">{t('creatorApplyDesc2')}</span>
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Name and Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="creator-name" className="block text-sm font-bold text-white mb-2">
                      {t('formName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="creator-name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder={t('creatorPlaceholderName')}
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-phone" className="block text-sm font-bold text-white mb-2">
                      {t('formPhone')}
                    </label>
                    <input
                      type="tel"
                      id="creator-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setFormData({ ...formData, phone: value })
                      }}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="creator-email" className="block text-sm font-bold text-white mb-2">
                    {t('formEmail')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="creator-email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                    placeholder="example@email.com"
                  />
                </div>

                {/* SNS Links — 인스타그램만 필수 */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="creator-instagram" className="block text-sm font-bold text-white mb-2">
                      {t('creatorLabelInstagram')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="creator-instagram"
                      name="instagram_url"
                      value={formData.instagram_url}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-youtube" className="block text-sm font-bold text-white mb-2">
                      {t('creatorLabelYoutube')}
                    </label>
                    <input
                      type="url"
                      id="creator-youtube"
                      name="youtube_url"
                      value={formData.youtube_url}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-tiktok" className="block text-sm font-bold text-white mb-2">
                      {t('creatorLabelTiktok')}
                    </label>
                    <input
                      type="url"
                      id="creator-tiktok"
                      name="tiktok_url"
                      value={formData.tiktok_url}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="https://tiktok.com/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-x" className="block text-sm font-bold text-white mb-2">
                      {t('creatorLabelX')}
                    </label>
                    <input
                      type="url"
                      id="creator-x"
                      name="x_url"
                      value={formData.x_url}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="https://x.com/..."
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="creator-message" className="block text-sm font-bold text-white mb-2">
                    {t('creatorMessage')}
                  </label>
                  <textarea
                    id="creator-message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all resize-none"
                    placeholder={t('creatorPlaceholderMessage')}
                  />
                </div>

                <div className="text-center pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-6 text-lg font-black rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('formSubmitting') : t('creatorSubmitButton')}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* Success Dialog */}
          <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
            <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-700/50 rounded-none">
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-white/10 rounded-none">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black text-white">
                  {t('dialogSuccessTitle')}
                </DialogTitle>
                <DialogDescription className="pt-4 text-base leading-relaxed text-zinc-200">
                  {t('dialogSuccessDesc')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center">
                <Button
                  onClick={() => {
                    setSuccessDialogOpen(false)
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      instagram_url: '',
                      youtube_url: '',
                      tiktok_url: '',
                      x_url: '',
                      message: '',
                    })
                  }}
                  className="w-full sm:w-auto px-8 font-black rounded-none"
                >
                  {t('dialogConfirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </section>
    </>
  )
}

/** Suspense fallback: 로케일/번역 없이 정적 플레이스홀더만 렌더링하여 Hydration Mismatch 방지 */
function CreatorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-24 px-4 sm:px-6 lg:px-24" aria-hidden="true">
      <div className="container mx-auto max-w-7xl">
        <div className="h-32 w-full max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<CreatorFallback />}>
        <Suspense fallback={<CreatorFallback />}>
          <CreatorContent />
        </Suspense>
      </SafeHydration>
    </main>
  )
}
