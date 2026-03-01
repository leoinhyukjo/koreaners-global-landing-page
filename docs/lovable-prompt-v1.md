# KOREANERS 랜딩페이지 리디자인 — Lovable 프롬프트

> 아래 `---` 사이의 내용을 Lovable에 붙여넣기

---

B2B 인플루언서 마케팅 에이전시 "KOREANERS"의 메인 랜딩페이지를 만들어줘.

## 디자인 방향

**스타일: Exaggerated Minimalism (에디토리얼)**
Squarespace Forma 템플릿(https://forma-fluid-demo.squarespace.com/) 느낌을 참고해줘.

핵심 원칙:
- **흑백 교차 섹션**: 다크(#000000, #111111) ↔ 라이트(#FFFFFF, #F5F5F5) 배경을 번갈아 배치
- **오버사이즈 타이포**: 헤딩은 `font-size: clamp(3rem, 10vw, 8rem)`, `font-weight: 900`, `letter-spacing: -0.03em`
- **이탤릭 악센트**: 각 섹션 헤딩에서 핵심 1단어를 세리프 이탤릭(Playfair Display Italic)으로 강조
- **극단적 여백**: 섹션 패딩 `py-24 md:py-32 lg:py-40`, 요소 간 gap 넉넉하게
- **비대칭 레이아웃**: 모든 것을 가운데 정렬하지 말고, 좌측 정렬 헤딩 + 우측 콘텐츠 등 에디토리얼 그리드
- **단일 악센트 컬러만**: 흑백 외에 색상 사용 최소화. 필요 시 CTA에만 사용
- **SVG 아이콘만**: 이모지 절대 사용 금지. Lucide 아이콘 사용
- **cursor-pointer**: 모든 클릭 가능 요소에 적용

## 타이포그래피 (3폰트 시스템)

| 역할 | 폰트 | 용도 |
|------|------|------|
| Display | Barlow Condensed (700, 900) | 섹션 헤딩, 대형 숫자, 스텝 번호 |
| Accent | Playfair Display Italic (400, 700) | 헤딩 내 강조 단어 1개씩 |
| Body | Noto Sans KR (한국어) / Noto Sans JP (일본어) (300, 400, 500, 700) | 본문, 설명, UI 요소 |

Google Fonts:
```
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Playfair+Display:ital,wght@1,400;1,700&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
```

## 색상 시스템

| 용도 | 라이트 섹션 | 다크 섹션 |
|------|-----------|----------|
| 배경 | #FFFFFF | #000000 |
| 서피스 | #F5F5F5 | #111111 |
| 텍스트 | #09090B | #FAFAFA |
| 뮤트 텍스트 | #666666 | #888888 |
| 보더 | rgba(0,0,0,0.12) | rgba(255,255,255,0.12) |
| CTA 버튼 | #000 bg + #FFF text | #FFF bg + #000 text |

## 다국어 (한국어 + 일본어)

- 우측 상단에 `KR / JP` 언어 토글 (세그먼트 버튼 스타일)
- 아래 모든 콘텐츠에 [KR], [JP]로 표기한 텍스트를 각각 사용
- React state로 즉시 전환 (새로고침 없음)

## 브랜드 컨텍스트

- **회사명**: KOREANERS (코리너스)
- **사업**: 일본 시장 진출을 위한 인플루언서 마케팅 에이전시
- **타겟**: 일본에 진출하려는 한국 브랜드 (뷰티, F&B, 패션)
- **톤**: 전문적이고 자신감 있는, 하지만 접근 가능한

---

## 섹션 구성 (위→아래)

### 1. Navigation (고정 헤더)
- 투명 배경 → 스크롤 20px 이상 시 `bg-black/90 backdrop-blur-md`
- 좌측: `KOREANERS` 텍스트 로고 (Barlow Condensed, font-black, uppercase, tracking-tight)
- 우측: 메뉴 링크 5개 + KR/JP 토글
  - 메뉴: Service, Portfolio, Blog, Creator, Contact
  - 호버: 밑줄 애니메이션 (width 0→100%, transition 300ms)
- 모바일: 햄버거 → 풀스크린 오버레이 (다크 배경, 메뉴 세로 나열, 큰 글씨)

### 2. Hero (배경: #000)
풀스크린 높이 `min-h-screen`. 중앙 정렬.

**태그라인** (작게, 본문 폰트):
- [KR] `당신의 글로벌 비즈니스 파트너`
- [JP] `あなたのグローバルビジネスパートナー`
- 스타일: `text-sm uppercase tracking-[0.3em] text-white/60`

**메인 헤딩** (초대형, Barlow Condensed 900):
```
*BEYOND*
AGENCY
```
- "BEYOND"을 Playfair Display Italic으로, "AGENCY"를 Barlow Condensed로
- 크기: `text-7xl md:text-8xl lg:text-[10rem]`, `leading-[0.85]`
- 색상: #FFFFFF

**서브카피** (본문 폰트, `text-lg md:text-xl`):
- [KR] `일본 시장 진출의 모든 것, 데이터 기반 인플루언서 마케팅으로 성과를 만듭니다`
- [JP] `日本市場進出のすべて、データ基盤インフルエンサーマーケティングで成果を作ります`
- 스타일: `text-white/70 max-w-xl mx-auto mt-8`

**CTA 2개** (`mt-12 flex gap-4 justify-center`):
- Primary: 흰색 배경, 검은 텍스트, `px-8 py-4 text-sm font-bold uppercase tracking-wider`
  - [KR] `무료 상담 신청 →`
  - [JP] `無料相談を申し込む →`
  - 호버: 반전 (bg-transparent, border-white, text-white)
- Secondary: 투명, 흰 테두리 1px, `px-8 py-4 text-sm font-bold uppercase tracking-wider`
  - [KR] `포트폴리오 보기`
  - [JP] `ポートフォリオを見る`
  - 호버: bg-white/10

### 3. 파트너 마키 (Marquee)
히어로 바로 아래. 다크 배경 유지.

- 상하 `border-y border-white/10`으로 구분
- **2줄** 마키: 1줄은 좌→우, 2줄은 우→좌 (반대 방향)
- 파트너사 이름 (26개):
  `BBIA · FOODOLOGY · Matin Kim · medicube · 강남언니 · 뉴트리원 · 달바 · 라운드랩 · 레디영 · 마녀공장 · 바닐라코 · 셀퓨전씨 · 아누아 · 아모레퍼시픽 · 에뛰드 · 올리브영 · 이니스프리 · 클리오 · 토리든 · 홀리카홀리카 · VT Cosmetics · SKIN1004 · COSRX · BY ECOM · AXIS-Y · Torriden`
- 텍스트: `text-sm font-semibold uppercase opacity-50`
- 각 이름 사이에 `·` 또는 `—` 구분자
- CSS animation: `marquee-left 45s linear infinite` / `marquee-right 45s linear infinite`
- 호버 시 `animation-play-state: paused`
- 패딩: `py-4`

### 4. 시장 기회 (배경: #FFFFFF) ← 흑→백 전환
**비대칭 2열 레이아웃** (`grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-start`)

**좌측 텍스트:**
- 섹션 태그: `MARKET OPPORTUNITY` (text-xs uppercase tracking-[0.2em] text-black/40)
- 헤딩 (Barlow Condensed 900, text-5xl lg:text-7xl, text-black):
  - [KR] `왜` + ` ` + `*일본*` + `인가?` → "일본"을 Playfair Display Italic
  - [JP] `なぜ*日本*なのか？` → "日本"을 Playfair Display Italic
- 본문 (text-lg, text-black/70, leading-relaxed, mt-6):
  - [KR] `세계 3위 경제대국, 5억 달러 규모의 인플루언서 마케팅 시장. K-뷰티와 K-컬처에 대한 수요가 폭발적으로 증가하고 있습니다.`
  - [JP] `世界第3位の経済大国、5億ドル規模のインフルエンサーマーケティング市場。K-ビューティーとK-カルチャーへの需要が爆発的に増加しています。`

**우측 통계 카드 3개** (세로 스택, `flex flex-col gap-4`):

| 수치 | 설명 KR | 설명 JP |
|------|---------|---------|
| 500만+ | 일본 내 K-뷰티 관심 소비자 | 日本国内のK-ビューティー関心消費者 |
| 25% | 전년 대비 K-콘텐츠 소비 증가율 | 前年比K-コンテンツ消費増加率 |
| 90% | 인플루언서 추천 후 구매 전환 | インフルエンサー推薦後の購買転換 |

- 카드 스타일: `bg-[#F5F5F5] border border-black/10 p-8`
- 숫자: Barlow Condensed 900, `text-5xl`, 검은색
- 한국어 "만" / 일본어 "万" suffix
- 설명: `text-sm text-black/60 mt-2`

### 5. 진입 장벽 (배경: #000000) ← 백→흑 전환

**헤딩:**
- 태그: `BARRIERS` (text-xs uppercase tracking-[0.2em] text-white/40)
- 메인 (Barlow Condensed 900, text-4xl lg:text-6xl, text-white):
  - [KR] `이런 *벽*에 부딪히고 계신가요?` → "벽"을 Playfair Display Italic
  - [JP] `こんな*壁*にぶつかっていませんか？`

**2×2 그리드** (`grid grid-cols-1 md:grid-cols-2 gap-4 mt-16`):

| Lucide 아이콘 | 제목 KR | 제목 JP | 설명 KR | 설명 JP |
|--------------|---------|---------|---------|---------|
| Database | 데이터 블랙박스 | データブラックボックス | 어떤 인플루언서가 효과적인지, 어떤 콘텐츠가 통하는지 데이터 없이 감으로 진행 | どのインフルエンサーが効果的か、どのコンテンツが通じるかデータなしで感覚で進行 |
| Shield | 신뢰 장벽 | 信頼の壁 | 일본 소비자는 현지 인플루언서의 진정성 있는 리뷰를 중시. 단순 광고는 역효과 | 日本の消費者は現地インフルエンサーの真実味のあるレビューを重視。単純広告は逆効果 |
| Target | 전략 부재 | 戦略の不在 | 타겟 오디언스 분석 없이 무작위 시딩은 예산 낭비로 직결 | ターゲットオーディエンス分析なしの無差別シーディングは予算の無駄に直結 |
| AlertTriangle | 운영 리스크 | 運営リスク | 언어, 문화, 상거래 관습의 차이로 인한 커뮤니케이션 사고와 브랜드 리스크 | 言語、文化、商慣習の違いによるコミュニケーション事故とブランドリスク |

- 카드: `bg-[#111] border border-white/10 p-8`
- 호버: `border-white/50 -translate-y-1 transition-all duration-300`
- 아이콘: `w-10 h-10 text-white/60 mb-4`
- 제목: `text-lg font-bold text-white mb-2`
- 설명: `text-sm text-white/60 leading-relaxed`

### 6. 솔루션 로드맵 (배경: #FFFFFF) ← 흑→백 전환

**헤딩:**
- 태그: `OUR PROCESS`
- 메인 (Barlow Condensed 900, text-4xl lg:text-6xl):
  - [KR] `데이터로 설계하고, *성과*로 증명합니다` → "성과"를 Playfair Display Italic
  - [JP] `データで設計し、*成果*で証明します`

**4단계 타임라인** — 좌측에 세로선 + 스텝 번호, 우측에 내용:

**STEP 01 — Diagnostic**
- [KR] 제목: `시장 진단 & 전략 수립` / [JP] `市場診断＆戦略策定`
- [KR] 설명: `타겟 시장과 경쟁 환경을 분석하고, 브랜드에 최적화된 인플루언서 마케팅 전략을 설계합니다`
- [JP] `ターゲット市場と競合環境を分析し、ブランドに最適化されたインフルエンサーマーケティング戦略を設計します`
- 하위 3개: 경쟁사 벤치마킹 / 타겟 오디언스 프로파일링 / KPI 설계

**STEP 02 — Seeding**
- [KR] 제목: `인플루언서 매칭 & 시딩` / [JP] `インフルエンサーマッチング＆シーディング`
- [KR] 설명: `1,000+ 검증된 일본 인플루언서 네트워크에서 브랜드 핏이 맞는 크리에이터를 선별하고 대량 시딩을 실행합니다`
- [JP] `1,000+検証済みの日本インフルエンサーネットワークからブランドフィットするクリエイターを選別し大量シーディングを実行します`
- 하위 3개: 크리에이터 DB 매칭 / 제품 배송 & 가이드라인 / 콘텐츠 품질 관리

**STEP 03 — Impact**
- [KR] 제목: `캠페인 실행 & 최적화` / [JP] `キャンペーン実行＆最適化`
- [KR] 설명: `캠페인 라이브 후 실시간 데이터 모니터링으로 성과를 추적하고, 즉각적인 최적화를 진행합니다`
- [JP] `キャンペーンライブ後、リアルタイムデータモニタリングで成果を追跡し、即座の最適化を進めます`
- 하위 3개: 실시간 퍼포먼스 대시보드 / A/B 콘텐츠 테스트 / ROI 최적화

**STEP 04 — Management**
- [KR] 제목: `리포팅 & 장기 운영` / [JP] `レポーティング＆長期運営`
- [KR] 설명: `캠페인 종료 후 종합 리포트를 제공하고, 장기적인 일본 시장 브랜딩 전략을 함께 수립합니다`
- [JP] `キャンペーン終了後、総合レポートを提供し、長期的な日本市場ブランディング戦略を共に策定します`
- 하위 3개: 캠페인 종합 리포트 / 인사이트 & 넥스트 액션 / 연간 파트너십 관리

**타임라인 비주얼:**
- 좌측: 세로 라인(1px, black/20) + 각 스텝에 원형 노드(w-12 h-12, border-2, 스텝 번호)
- 번호: Barlow Condensed 700, `text-sm`
- 태그 라벨 (Diagnostic 등): `text-xs uppercase tracking-wider bg-black text-white px-3 py-1`
- 하위 기능: 불릿 리스트 `text-sm text-black/50`

### 7. 실적 & 성과 (배경: #000000) ← 백→흑 전환

**헤딩:**
- 태그: `RESULTS`
- 메인 (Barlow Condensed 900, text-4xl lg:text-6xl, text-white):
  - [KR] `*숫자*가 증명합니다` → "숫자"를 Playfair Display Italic
  - [JP] `*数字*が証明します`

**4열 그리드** (`grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16`):

| 수치 | 설명 KR | 설명 JP |
|------|---------|---------|
| 300+ | 누적 캠페인 수 | 累積キャンペーン数 |
| 105 | 파트너 브랜드 수 | パートナーブランド数 |
| 30만+ | 도달 소비자 수 | リーチ消費者数 |
| 250% | 평균 ROI | 平均ROI |

- 숫자: Barlow Condensed 900, `text-6xl lg:text-8xl text-white`, leading-none
- 한국어: "30만+", 일본어: "30万+"
- 설명: `text-sm text-white/50 mt-3 uppercase tracking-wider`
- **Counter 애니메이션**: 스크롤 인뷰 시 0에서 타겟까지 카운트업 (duration 2s, easeOut)
- 각 셀 사이에 세로 구분선 `border-r border-white/10` (마지막 셀 제외)

### 8. 포트폴리오 (배경: #FFFFFF) ← 흑→백 전환

**헤딩:**
- 태그: `PORTFOLIO`
- 메인:
  - [KR] `최근 *캠페인*` → "캠페인"을 Playfair Display Italic
  - [JP] `最近の*キャンペーン*`

**3열 카드 그리드** (`grid grid-cols-1 md:grid-cols-3 gap-6 mt-16`):
- placeholder 카드 3개 (실제 데이터 나중에 연결)
- 각 카드:
  - 상단: placeholder 이미지 (`aspect-video bg-[#F5F5F5]`)
  - 카테고리 태그: `text-xs uppercase tracking-wider text-black/40 mt-4`
  - 제목: `text-xl font-bold text-black mt-2`
  - 클라이언트: `text-sm text-black/50 mt-1`
- 호버: 이미지 `scale-105`, 카드에 `shadow-lg`, `transition-all duration-500`
- 카드 전체에 `cursor-pointer`

**하단 CTA** (`mt-12 text-center`):
- [KR] `전체 포트폴리오 보기 →`
- [JP] `全ポートフォリオを見る →`
- 스타일: 텍스트 링크 (밑줄 + 호버 시 밑줄 굵어짐), `text-sm uppercase tracking-wider font-bold`

### 9. 문의 폼 (배경: #111111)

**비대칭 2열** (`grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 items-start`):

**좌측:**
- 헤딩 (Barlow Condensed 900, `text-6xl lg:text-8xl text-white leading-[0.85]`):
  ```
  LET'S
  *TALK*
  ```
  "TALK"을 Playfair Display Italic
- 설명 (`text-base text-white/60 mt-8 leading-relaxed`):
  - [KR] `일본 시장 진출에 대해 궁금한 점이 있으시다면 언제든 연락주세요. 전문 컨설턴트가 무료로 상담해드립니다.`
  - [JP] `日本市場進出についてご質問があればいつでもご連絡ください。専門コンサルタントが無料でご相談いたします。`
- 이메일: `leo@koreaners.com` (`text-sm text-white/40 mt-4`)

**우측 폼:**
- 필드 6개 + 체크박스 2개:
  - 이름 (필수), 회사명 (필수), 직책 (필수) → 3열 그리드 (`grid-cols-3`)
  - 이메일 (필수), 전화번호 (필수) → 2열 그리드
  - 메시지 (필수, textarea, 4줄)
  - ☐ 개인정보 수집·이용 동의 (필수) — 밑줄 링크로 전문 보기
  - ☐ 마케팅 수신 동의 (선택)
- 입력 필드 스타일: `border-b border-white/20 bg-transparent text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/30`
- label: `text-xs uppercase tracking-wider text-white/40 mb-2`
- Submit 버튼: `w-full bg-white text-black py-4 text-sm font-bold uppercase tracking-wider hover:bg-white/90 transition-colors duration-300 mt-8 cursor-pointer`
  - [KR] `상담 신청하기`
  - [JP] `相談を申し込む`

### 10. Footer (배경: #000000)
`py-12 border-t border-white/10`

- 로고: `KOREANERS` (Barlow Condensed, text-lg)
- 회사 정보 (`text-xs text-white/30`):
  - [KR] 코리너스 | 대표: 조인혁 | 사업자번호: 354-18-01705
  - 주소: 서울특별시 서대문구 연희로 134-1
- 링크: 개인정보처리방침 (`text-white/30 hover:text-white/60`)
- 저작권: `© 2025 KOREANERS. All rights reserved.`

---

## 글로벌 애니메이션 규칙

- **스크롤 인뷰**: 모든 섹션 콘텐츠에 `fade-in + translateY(20px→0)`, duration 0.6s, ease-out
- **stagger**: 같은 섹션 내 카드/요소는 0.1s씩 시차
- **마키**: CSS `@keyframes`로 무한 스크롤, 호버 시 정지
- **Counter**: IntersectionObserver로 인뷰 감지 → 0에서 타겟까지 카운트 (2s, easeOut)
- **호버**: `transition-all duration-300`, transform과 opacity만 사용 (layout shift 방지)
- **prefers-reduced-motion**: 사용자가 모션 감소 설정 시 모든 애니메이션 비활성화

## 반응형 브레이크포인트

| 기기 | 범위 | 특징 |
|------|------|------|
| 모바일 | < 768px | 1열, 터치 타겟 44px+, 메뉴 → 햄버거 |
| 태블릿 | 768~1024px | 2열 전환, 여백 축소 |
| 데스크탑 | 1024px+ | 풀 그리드, 비대칭 레이아웃 활성 |
| 와이드 | 1440px+ | `max-w-7xl mx-auto`로 컨텐츠 제한 |

## 접근성 체크리스트

- [ ] 색상 대비 4.5:1 이상 (WCAG AA)
- [ ] 모든 인터랙티브 요소에 focus ring 표시
- [ ] 이미지에 alt 텍스트
- [ ] 폼 input에 label 연결
- [ ] 키보드 탐색 순서 = 시각적 순서
- [ ] 터치 타겟 최소 44×44px

---
