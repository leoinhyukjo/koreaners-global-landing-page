'use client'

import { useEffect, useState, Suspense } from 'react'
import { Navigation } from '@/components/navigation'
import { Users, Instagram, Youtube, Music, Award, Target, X } from 'lucide-react'
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

const CREATORS_PER_PAGE = 12

function CreatorContent() {
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

  // 신청 폼 상태
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
        .order('created_at', { ascending: false })

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

    // 필수 필드 검증
    if (!formData.name.trim()) {
      toast({
        title: '입력 오류',
        description: '이름을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.email.trim()) {
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

    if (!formData.phone.trim()) {
      toast({
        title: '입력 오류',
        description: '연락처를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
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

      // Supabase inquiries 테이블에 저장 (type: 'creator_application')
      const insertData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: cleanPhone,
        message: `[크리에이터 신청]\n\n인스타그램: ${formData.instagram_url || '없음'}\n유튜브: ${formData.youtube_url || '없음'}\n틱톡: ${formData.tiktok_url || '없음'}\nX(Twitter): ${formData.x_url || '없음'}\n\n요청사항:\n${formData.message.trim() || '없음'}`,
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
        title: '제출 실패',
        description: '신청 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-balance leading-tight">
              <span className="text-white">105명의 전속 크리에이터</span>
              <br />
              <span className="text-white">검증된 전환 파워</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-3xl mx-auto text-pretty px-2">
              일본 Z세대 67%의 구매 결정을 이끌어내는 실질적인 전환 엔진
            </p>
          </div>

          {/* Creator Cards Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-zinc-200">로딩 중...</p>
            </div>
          ) : allCreators.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-200 text-lg">등록된 크리에이터가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* Pagination - 타깃별 최적화된 크리에이터 풀 섹션 상단 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-12">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20">
                {creators.map(creator => (
                <Card 
                  key={creator.id}
                  className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300"
                >
                  {/* Creator Avatar */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                    {/* 프로필 이미지 */}
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url}
                        alt={creator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-20 h-20 text-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-white transition-colors">
                      {creator.name}
                    </h3>
                    
                    {/* SNS 링크 */}
                    <div className="flex gap-3">
                      {creator.instagram_url ? (
                        <a
                          href={creator.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none">
                          <Instagram className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      
                      {creator.youtube_url ? (
                        <a
                          href={creator.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                          aria-label="YouTube"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none">
                          <Youtube className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      
                      {creator.tiktok_url ? (
                        <a
                          href={creator.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                          aria-label="TikTok"
                        >
                          <Music className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none">
                          <Music className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}

                      {creator.x_url || creator.twitter_url ? (
                        <a
                          href={creator.x_url || creator.twitter_url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                          aria-label="X (Twitter)"
                        >
                          <X className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-zinc-700/50 opacity-30 pointer-events-none">
                          <X className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              </div>
            </>
          )}

          {/* Creator Categories */}
          <div className="mb-20">
            <h2 className="text-3xl font-black text-center mb-12 text-white">
              <span className="text-white">타깃별 최적화된 </span>
              <span className="text-white">크리에이터 풀</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">플랫폼별 전문성</h3>
                <ul className="space-y-3 text-zinc-200">
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">Instagram:</span> 비주얼 중심 뷰티/패션 카테고리 전문</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">TikTok:</span> Z세대 타깃 숏폼 바이럴 전문가</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">YouTube:</span> 롱폼 리뷰 및 언박싱 콘텐츠</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">성별·연령별 세분화</h3>
                <ul className="space-y-3 text-zinc-200">
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">10대 여성:</span> K-뷰티, K-패션 트렌드 리더</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">20대 여성:</span> 라이프스타일, 웰니스 인플루언서</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">30대 여성:</span> 프리미엄 뷰티, 육아 카테고리</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white mt-1">•</span>
                    <span><span className="font-medium text-white">남성 크리에이터:</span> 테크, F&B, 라이프스타일</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Why Our Creators */}
          <div className="mb-20">
            <h2 className="text-3xl font-black text-center mb-12 text-white">
              <span className="text-white">코리너스 크리에이터</span>
              <span className="text-white">만의 차별점</span>
            </h2>

            <div className="space-y-6">
              <Card className="p-8 bg-zinc-800 border-zinc-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-none">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">전속 계약으로 보장되는 품질</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      일회성 협업이 아닌 전속 계약으로 브랜드 이해도가 높고, 가이드라인 준수율이 높은 안정적인 콘텐츠 생산이 가능합니다. 노쇼(No-show) 리스크가 없으며, 즉각적인 대체 인력 투입이 가능합니다.
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
                    <h3 className="text-xl font-bold text-white mb-3">설명력 있는 콘텐츠 제작</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      단순히 예쁜 비주얼이 아닌, 일본 소비자가 궁금해하는 포인트를 정확히 짚어내는 '설명력 있는 콘텐츠'를 생산합니다. 이는 일본 Z세대의 구매 결정 요인 1위(29.5%)로, 인지에서 전환까지 직접 연결되는 핵심 요소입니다.
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
                    <h3 className="text-xl font-bold text-white mb-3">현지화된 콘텐츠 감각</h3>
                    <p className="text-zinc-200 leading-relaxed">
                      일본 소비자가 느끼는 '위화감(違和感)'을 완벽히 제거한 콘텐츠를 제작합니다. 한국식 소구점을 그대로 적용하는 것이 아니라, 일본 특유의 신중한 구매 패턴과 SNS 문법을 완벽히 이해하고 반영합니다.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Creator Application Form */}
          <section className="py-12 sm:py-16 px-5 sm:px-6 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 mb-20">
            <div className="container mx-auto max-w-5xl">
              <div className="mb-8 sm:mb-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 break-keep">
                  전속 크리에이터 합류 신청
                </h1>
                <p className="text-base sm:text-lg text-zinc-200 leading-relaxed mb-2 font-medium break-keep max-w-prose">
                  <span className="inline-block">코리너스와 함께 일본 시장을 공략하는</span>{' '}
                  <span className="inline-block">크리에이터가 되어보세요.</span>
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Name and Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="creator-name" className="block text-sm font-bold text-white mb-2">
                      성함 <span className="text-white">*</span>
                    </label>
                    <input
                      type="text"
                      id="creator-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                      placeholder="이름을 입력해주세요."
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-phone" className="block text-sm font-bold text-white mb-2">
                      연락처 <span className="text-white">*</span>
                    </label>
                    <input
                      type="tel"
                      id="creator-phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        // 숫자만 추출 (하이픈, 공백, 기타 문자 제거)
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
                    이메일 <span className="text-white">*</span>
                  </label>
                  <input
                    type="email"
                    id="creator-email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                    placeholder="example@email.com"
                  />
                </div>

                {/* SNS Links */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="creator-instagram" className="block text-sm font-bold text-white mb-2">
                      인스타그램 링크
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
                      유튜브 링크
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
                      틱톡 링크
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
                      X 링크 (선택)
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
                    메시지
                  </label>
                  <textarea
                    id="creator-message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700/50 rounded-none text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all resize-none"
                    placeholder="협업 요청사항이나 자기소개를 적어주세요"
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-6 text-lg font-black rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '처리 중...' : '협업 신청하기'}
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
                  신청 완료
                </DialogTitle>
                <DialogDescription className="pt-4 text-base leading-relaxed text-zinc-200">
                  신청이 완료되었습니다. 담당자가 1~2 영업일 이내로 연락 드립니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center">
                <Button
                  onClick={() => {
                    setSuccessDialogOpen(false)
                    // 폼 초기화
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      instagram_url: '',
                      youtube_url: '',
                      tiktok_url: '',
                      message: '',
                    })
                  }}
                  className="w-full sm:w-auto px-8 font-black rounded-none"
                >
                  확인
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </section>
    </>
  )
}

export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-zinc-900">
      <Navigation />
      <Suspense
        fallback={
          <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-balance leading-tight">
                  <span className="text-white">105명의 전속 크리에이터</span>
                  <br />
                  <span className="text-white">검증된 전환 파워</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-3xl mx-auto text-pretty px-2">
                  일본 Z세대 67%의 구매 결정을 이끌어내는 실질적인 전환 엔진
                </p>
              </div>
              <div className="text-center py-20">
                <p className="text-zinc-200">로딩 중...</p>
              </div>
            </div>
          </section>
        }
      >
        <CreatorContent />
      </Suspense>
    </main>
  )
}
