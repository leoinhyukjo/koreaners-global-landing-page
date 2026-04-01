# Warm Futurism 디자인 리뉴얼

> 전체 사이트 디자인 리뉴얼 — 기존 Organic Warm 컬러 유지 + 트렌디 효과 (glassmorphism, 3D, kinetic typography, aurora mesh gradient) 적용

## 스코프

- **대상**: 모든 퍼블릭 페이지 (메인, 서비스, 크리에이터, 포트폴리오, 블로그, 커리어, about, contact, privacy)
- **제외**: 어드민 페이지 (`/admin/*`), API 라우트
- **접근**: 기존 컬러 팔레트 (#FF4500, #1C1917, #FAF7F2, #F3EDE4) 100% 유지, 효과 레이어만 추가
- **강도**: 임팩트 강한 쇼케이스 (Apple Vision Pro, Framer 프리미엄 수준)

## 1. 글로벌 효과 시스템 (전 페이지 공통)

### 1.1 글래스모피즘 카드
- 다크 섹션: `backdrop-blur-xl` + `bg-white/5` + `border border-white/10`
- 크림 섹션: `backdrop-blur-xl` + `bg-white/40` + `border border-white/20`
- inner shadow로 깊이감: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`

### 1.2 3D 마우스 트래킹 틸트
- 적용 대상: 주요 카드 (크리에이터, 포트폴리오, 스탯, 서비스)
- 부모: `perspective: 1000px`
- 최대 회전: `rotateX/Y ±8deg`
- 호버 시: `scale(1.02)` + 오렌지 glow shadow (`0 20px 60px rgba(255,69,0,0.15)`)
- 모바일: 비활성화 (터치 디바이스 감지)
- 구현: 커스텀 훅 `useTilt()` — `requestAnimationFrame` + `will-change: transform`

### 1.3 오로라 Mesh Gradient 배경
- 다크 섹션 배경에 2~3개 블러 blob
- 색상: 오렌지 `rgba(255,69,0,0.12)`, 앰버 `rgba(245,158,11,0.08)`, 틸 `rgba(13,148,136,0.06)`
- CSS: `position: absolute` + `filter: blur(120px)` + `border-radius: 50%`
- 애니메이션: `@keyframes aurora` — `translate` + 미세한 `scale` 변화, 15~20초 사이클
- 모바일: blob 2개로 축소

### 1.4 마우스 커서 Glow Spotlight
- 다크 섹션 전용
- `radial-gradient(400px circle, rgba(255,69,0,0.06), transparent)`
- 마우스 좌표 추적: `onMouseMove` + `throttle(16ms)`
- `pointer-events: none`, `position: fixed`
- 모바일: 비활성화
- 구현: 커스텀 훅 `useGlowSpotlight()`

### 1.5 스크롤 모션 강화
- 기존 FadeIn: `translateY(40px)` + `opacity: 0` → `translateY(0)` + `opacity: 1`
- stagger delay: 자식 요소 0.1초 간격
- 숫자 카운트업: intersection observer 트리거, 0에서 목표값까지 1.5초 easeOut
- `viewport={{ once: true }}` 유지 (재계산 방지)
- 구현: 기존 `FadeIn`/`StaggerContainer` 컴포넌트 확장

### 1.6 도트/그리드 텍스처
- 다크 섹션에 미세한 도트 패턴 오버레이
- CSS `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)` + `background-size: 24px 24px`
- `pointer-events: none`

## 2. 히어로 섹션 (메인 페이지)

### 2.1 Kinetic Typography
- 메인 헤드라인: 글자 단위 stagger 등장
  - 각 글자 `translateY(100%)` + `opacity: 0` → `translateY(0)` + `opacity: 1`
  - stagger: 0.03초 간격
  - 등장 후 `gradient-warm-text` 적용
- 서브 헤드라인: 타이프라이터 효과 (글자 하나씩 타이핑)
- 구현: `KineticText` 컴포넌트 (Framer Motion `variants`)

### 2.2 배경
- 현재 `hero-glow` radial gradient → 대형 오로라 mesh gradient로 교체
- 3~4개 블러 blob이 느리게 이동 + 색상 변화 (오렌지→앰버→틸)
- 미세한 도트 패턴 오버레이
- 구현: `AuroraBackground` 컴포넌트

### 2.3 CTA 버튼
- 글래스모피즘 베이스
- Animated gradient border: `background: conic-gradient(from var(--angle), #FF4500, #F59E0B, #0D9488, #FF4500)` + `@property --angle` 회전
- 호버 시: glow 확산 (`box-shadow: 0 0 40px rgba(255,69,0,0.3)`) + `scale(1.05)`
- 클릭 시: ripple 효과 (CSS `::after` pseudo-element)
- 구현: `GlowButton` 컴포넌트

### 2.4 스크롤 인디케이터
- 하단 중앙: 화살표 아이콘 + bounce 애니메이션
- 스크롤 시작 시 fade out (`scrollY > 50` → `opacity: 0`)

## 3. 서브 페이지 히어로

- 페이지 타이틀: Barlow Condensed 대형, `translateX(-40px)` → `0` 슬라이드 인
- 서브텍스트: 0.3초 딜레이 fade in
- 배경: 페이지별 오로라 blob 1~2개 (위치/색상 변주)
- 높이: `py-24 md:py-32` (메인 히어로보다 작게)

## 4. 콘텐츠 카드 타입별

### 4.1 크리에이터 카드
- 글래스 카드 + 3D 틸트
- 호버: 프로필 이미지 `scale(1.05)` + 오렌지 보더 glow (`ring-2 ring-orange-500/50`)
- 팔로워 수: 스크롤 진입 시 카운트업

### 4.2 포트폴리오 카드
- 썸네일 hover overlay: 글래스 배경 + 프로젝트명 `translateY(20px)` → `0` 등장
- 3D 틸트 + 그림자 깊이 변화
- 트랜지션: `duration-300 ease-out`

### 4.3 스탯 카드
- 글래스 배경 + animated gradient border (conic-gradient 회전)
- 숫자: 카운트업 (intersection observer)
- 아이콘: `translateY(0px → -4px → 0px)` float 애니메이션 (3초 사이클)

### 4.4 서비스 카드
- 글래스모피즘
- 호버: `translateY(-8px)` + shadow 강화 (`shadow-2xl`)
- 아이콘 영역: 오렌지 glow circle 배경 (`radial-gradient(circle, rgba(255,69,0,0.15), transparent)`)

## 5. 네비게이션

- 스크롤 시: `backdrop-blur-xl` + `bg-[#1C1917]/80` 강화
- 메뉴 아이템 hover: 오렌지 언더라인 `scaleX(0)` → `scaleX(1)` (왼→오)
- 모바일 Sheet: 글래스 배경 + 메뉴 항목 stagger 등장 (0.05초 간격)
- CTA 버튼 "문의하기": 미세한 pulse glow (`animate-pulse-subtle` 강화)

## 6. 푸터

- 다크 배경에 오로라 blob 1개 (좌하단, 은은하게)
- 링크 hover: `color: #FF4500` 트랜지션 (`duration-200`)
- 소셜 아이콘 hover: `rotateY(180deg)` 3D flip + 오렌지 색상 전환

## 7. 새로 만들 컴포넌트

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `GlassCard` | `components/ui/glass-card.tsx` | 글래스모피즘 카드 래퍼 (variant: dark/light) |
| `TiltCard` | `components/ui/tilt-card.tsx` | 3D 마우스 트래킹 틸트 래퍼 |
| `AuroraBackground` | `components/ui/aurora-background.tsx` | 오로라 mesh gradient blob 배경 |
| `GlowSpotlight` | `components/ui/glow-spotlight.tsx` | 마우스 따라다니는 glow |
| `KineticText` | `components/ui/kinetic-text.tsx` | 글자 단위 stagger 애니메이션 텍스트 |
| `CountUp` | `components/ui/count-up.tsx` | 숫자 카운트업 (intersection observer) |
| `GlowButton` | `components/ui/glow-button.tsx` | animated gradient border 버튼 |
| `DotPattern` | `components/ui/dot-pattern.tsx` | 미세 도트 패턴 오버레이 |

## 8. 수정할 기존 파일

| 파일 | 변경 내용 |
|------|-----------|
| `globals.css` | 오로라 keyframes, animated border @property, 글래스 유틸리티 클래스, 도트 패턴, 커스텀 스크롤바 |
| `components/hero-section.tsx` | KineticText + AuroraBackground + GlowButton + 스크롤 인디케이터 |
| `components/navigation.tsx` | 글래스 강화 + 언더라인 애니메이션 + CTA glow |
| `components/layout/footer.tsx` | 오로라 blob + 소셜 아이콘 flip |
| 각 섹션 컴포넌트 | GlassCard + TiltCard 래핑 + CountUp 적용 |
| 서브 페이지 히어로 영역 | 슬라이드 인 + 오로라 배경 |
| `components/ui/fade-in.tsx` | stagger delay 파라미터 추가 |

## 9. 성능 가드레일

- 오로라 blob: CSS `filter: blur()` + `transform` — GPU 가속, JS 불필요
- 3D 틸트: `requestAnimationFrame` + `will-change: transform`, 이벤트 `throttle(16ms)`
- Glow spotlight: `throttle(16ms)` + `pointer-events: none`
- Framer Motion: `viewport={{ once: true }}` — 한번 등장 후 재계산 방지
- 모바일 최적화: 3D 틸트 비활성화, glow spotlight 비활성화, blob 개수 축소
- `prefers-reduced-motion: reduce`: 모든 모션 비활성화, 정적 상태만 표시
- 커스텀 스크롤바: `scrollbar-thin` + 오렌지 라인 (`::-webkit-scrollbar`)

## 10. 적용 순서 (구현 시)

1. **Phase 1 — 글로벌 기반**: globals.css 유틸리티 + 새 컴포넌트 8개 생성
2. **Phase 2 — 메인 페이지**: 히어로 + 각 섹션 GlassCard/TiltCard 적용
3. **Phase 3 — 네비게이션 & 푸터**: 글로벌 레이아웃 효과
4. **Phase 4 — 서브 페이지**: 7개 서브 페이지 히어로 + 카드 효과 적용
5. **Phase 5 — 모바일 최적화 & 접근성**: reduced-motion, 터치 디바이스, 성능 테스트
