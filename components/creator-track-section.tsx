'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, Users, Sparkles, Award, Target, TrendingUp } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

interface CreatorTrackSectionProps {
  onSelectTrack: (trackType: 'exclusive' | 'partner') => void
}

export function CreatorTrackSection({ onSelectTrack }: CreatorTrackSectionProps) {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <div className="mb-20">
      <div className="text-center space-y-4 sm:space-y-6 mb-16 sm:mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white break-words">
          {locale === 'ja'
            ? 'クリエイターの2つのパス'
            : '두 가지 크리에이터 경로'}
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl mx-auto break-words px-2">
          {locale === 'ja'
            ? 'あなたのキャリアと目標に合わせて、最適なパスを選択してください'
            : '당신의 커리어와 목표에 맞는 최적의 경로를 선택하세요'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* Exclusive Creator Track */}
          <Card className="overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700/50 hover:border-white transition-all duration-300">
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {locale === 'ja' ? '専属クリエイター' : '전속 크리에이터'}
                </h3>
              </div>

              <p className="text-zinc-300 mb-8 text-sm sm:text-base leading-relaxed">
                {locale === 'ja'
                  ? 'コンテンツ企画から撮影、商品企画・販売まで、すべてを一緒にサポート'
                  : '컨텐츠 기획부터 촬영, 굿즈 기획 및 판매까지 모든 과정을 함께 지원'}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? 'エンドツーエンド支援' : 'End-to-End 지원'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? 'コンテンツ企画から販売まで全てをサポート'
                        : '기획부터 판매까지 전 과정 지원'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Award className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? '専門サポート' : '전문가 지원'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? 'マーケティング、制作、営業チーム全て'
                        : '마케팅, 제작, 영업팀 전원 지원'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? '継続的な成長' : '지속적 성장'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? 'あなたのチャネルと影響力を一緒に拡大'
                        : '당신의 채널과 영향력을 함께 확대'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? '独占的パートナーシップ' : '독점 파트너십'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? '長期的な独占契約で安定した収入源'
                        : '장기 독점 계약으로 안정적 수입'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-700/50">
                <p className="text-xs text-zinc-400 mb-4">
                  {locale === 'ja'
                    ? '最適な方：ブランドと長期的にコラボしたい、複数ジャンルを扱いたい'
                    : '추천 대상: 브랜드와 장기 협업, 다양한 분야 시도 희망'}
                </p>
                <Button
                  onClick={() => onSelectTrack('exclusive')}
                  className="w-full px-8 py-3 text-base font-black bg-white text-black hover:bg-zinc-200 rounded-none transition-all"
                >
                  {locale === 'ja' ? '合流申し込む' : '합류 신청하기'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Partner Track */}
          <Card className="overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700/50 hover:border-white transition-all duration-300">
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {locale === 'ja' ? 'パートナー' : '파트너'}
                </h3>
              </div>

              <p className="text-zinc-300 mb-8 text-sm sm:text-base leading-relaxed">
                {locale === 'ja'
                  ? 'パートナーシッププールに登録して、最適な機会を待つ'
                  : '파트너십 풀에 등록하고 최적의 기회를 받으세요'}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? 'カスタマイズ機会' : '맞춤형 기회'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? 'ブランドと案件に応じて最適なクリエイターをマッチング'
                        : '브랜드와 프로젝트에 맞는 기회 제공'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? 'フレキシブル協力' : '자유로운 협업'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? '案件ごとに柔軟に参加・不参加を選択'
                        : '프로젝트별로 자유롭게 참여 선택'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Award className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? 'ブランド体験' : '다양한 브랜드 경험'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? '複数ブランドとのコラボレーション機会'
                        : '여러 브랜드와 협업할 수 있는 기회'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {locale === 'ja' ? 'スポット報酬' : '프로젝트 수당'}
                    </h4>
                    <p className="text-zinc-400 text-sm">
                      {locale === 'ja'
                        ? 'プロジェクトごとに競争力のある報酬'
                        : '프로젝트마다 경쟁력 있는 수당 지급'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-700/50">
                <p className="text-xs text-zinc-400 mb-4">
                  {locale === 'ja'
                    ? '最適な方：複数ブランドを試したい、案件ベースの協業希望'
                    : '추천 대상: 다양한 브랜드 경험, 프로젝트 기반 협업 희망'}
                </p>
                <Button
                  onClick={() => onSelectTrack('partner')}
                  className="w-full px-8 py-3 text-base font-black bg-white text-black hover:bg-zinc-200 rounded-none transition-all"
                >
                  {locale === 'ja' ? '合流申し込む' : '합류 신청하기'}
                </Button>
              </div>
            </div>
          </Card>
      </div>
    </div>
  )
}
