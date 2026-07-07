# 코리너스 랜딩 셰이더 디자인 가이드 — Paper Shaders 도입 (별첨)

> 상위 문서: `docs/plans/2026-07-07-frontend-improvement-guide.md` (전면 프론트 개선 가이드).
> 본 문서는 그중 셰이더 레이어 챕터의 상세 스펙이다. 우선순위와 페이즈는 상위 문서의 Clarity 데이터 기반 로드맵이 우선한다(모바일 92%, 홈 트래픽 78% — 모바일 히어로 셰이더 품질이 데스크톱보다 중요).

작성: 2026-07-07 (설계 전용, 구현 착수 전)
대상 구현자: 후속 세션의 Opus/Sonnet 에이전트
현황 근거: 라이브 사이트 전 페이지 스크린샷 검토(2026-07-07) + 레포 전수 조사 + Paper Shaders 소스 레벨 리서치

---

## 0. 한 줄 방향

**"hero-glow 를 살아있는 빛으로."** 지금 사이트의 시그니처인 정적 radial glow(`.hero-glow`)를 Paper Shaders 의 저휘도 셰이더 필드로 진화시킨다. 리디자인이 아니라 재질(material) 업그레이드다. 타이포그래피가 계속 주인공이고, 셰이더는 공기다.

- 2026-04-18 홈페이지 개편 킥오프 방향("심플 + 약간의 고급스러움 + 약간의 트렌디, 과도한 3D 지양")과 정합. mesh/grain gradient 는 3D 연출 없이 트렌디함과 고급감을 주는 정확히 그 지점의 도구다.
- Organic Warm v2 (`design-system/MASTER.md`) 는 유지한다. 색 토큰, 섹션 리듬, 타이포 시스템 모두 그대로. 셰이더는 기존 시스템 위의 레이어 하나다.

## 1. 현황 진단 (개선점)

### 1-1. 셰이더로 풀 것

| # | 위치 | 진단 |
|---|---|---|
| A | 홈 히어로 (`components/hero-section.tsx`) | BEYOND/AGENCY 대형 타이포는 강하지만 배경이 완전히 플랫. `.hero-glow` 만으로는 정적이고, 이미지/영상/모션 그래픽이 전무해 "고급스러움" 축이 비어 있음 |
| B | 서브페이지 히어로 전체 (service/creator/portfolio/blog/careers/about) | 전부 동일한 플랫 다크 + hero-glow. 페이지 간 구분이 헤드라인 텍스트뿐 |
| C | Market Opportunity 스탯 카드 (`gradient-sunset`) | 사이트 유일의 강한 컬러 모먼트인데 정적 CSS 그라데이션. 셰이더 업그레이드 시 가장 효과 대비 저비용 |
| D | FinalCTA 밴드 (홈 하단 전환 구간) | 플랫 다크 배경. 전환 직전 모먼트에 시각적 온도가 없음 |
| E | 블로그 인덱스 썸네일 | 동일한 브랜드 로고 타일이 3장씩 반복 노출되어 단조로움. 콘텐츠 채널의 전문성 인상을 깎음 |

### 1-2. 셰이더와 무관하게 같이 잡을 것

- Solution Roadmap 01~04 섹션: 초대형 타이포 우측이 대공백. 홈 전체 스크롤이 7,640px 인데 이 구간이 체감 길이의 절반. 수직 리듬 압축 또는 스텝별 소형 시각 요소 검토.
- `whileInView` 리빌: 빠른 스크롤 시 섹션이 빈 상태로 먼저 노출되는 순간이 있음. `viewport={{ margin: '-10% 0px' }}` 계열 튜닝으로 트리거를 앞당길 것.
- 데드 코드 정리: `globals.css` 의 `.dark` oklch 블록(미사용 shadcn 잔재), `tailwindcss-animate` 와 `tw-animate-css` 중복, body 폴백 스택의 'Inter'(실제 미로드) 정리.
- SEO Batch D 잔여(홈 H1 visible, LCP font-swap 등)는 히어로를 건드리는 이번 작업과 같은 PR 사이클에서 처리하는 것이 효율적.

## 2. 라이브러리 결정

**`@paper-design/shaders-react` 채택. 단, 버전 정확 핀(pin) 필수.**

| 항목 | 값 |
|---|---|
| 버전 (2026-07-07 기준) | 0.0.77 — 0.0.x 에서 breaking change 예고, `package.json` 에 `"0.0.77"` 고정 (^ 금지) |
| 라이선스 | Apache-2.0 |
| 의존성 | 런타임 제로 (WebGL2 직접 구현, three.js 없음) |
| 번들 | 전량 import 시 ~74KB gzip 상한. tree-shaking 시 셰이더 1~2종 기준 실질 25~35KB 추정 |
| SSR | `'use client'` 가 패키지에 내장. 캔버스 생성은 `useEffect` 안이라 hydration mismatch 구조적으로 없음. wrapper div 에 크기가 잡혀 CLS 없음 |
| 정적 프레임 | `speed={0}` 이면 rAF 루프 자체가 꺼짐. 최초 1회 드로우 후 GPU 유휴. `frame={ms}` 로 원하는 컷 선택 |
| 내장 지원 | 탭 숨김 자동 정지, ResizeObserver 리사이즈, `maxPixelCount` 해상도 클램프 |
| 미내장 (직접 구현) | `prefers-reduced-motion`, WebGL2 미지원 폴백(미지원 시 mount 에서 throw), 화면 밖 정지 |

대안 비교: CSS-only mesh 는 유기적 왜곡/모션 불가, three.js 는 150KB+ 과잉. 마케팅 사이트 배경 용도로는 Paper Shaders 가 적정점.

## 3. 디자인 원칙 (가드레일)

구현 에이전트는 아래를 계약으로 취급할 것.

1. **색은 기존 토큰만.** `#1C1917`(base), `#FF4500`(ember), `#F59E0B`(amber), `#0D9488`(teal, 그라데이션 전용 유지). 새 hex 도입 금지. 다크 지배력이 필요하면 colors 배열에 `#1C1917` 을 중복 배치해 어두운 면적을 늘린다.
2. **저휘도 원칙.** MASTER.md 앤티패턴 "전체 섹션 그라데이션 금지"는 명도 관점으로 계승한다. 다크 섹션 위에서 셰이더의 평균 휘도가 hero-glow 수준(은은한 발광)을 넘지 않게. 크림(`#FAF7F2`) 섹션 배경에는 셰이더 금지. 컬러가 전면에 나오는 것은 C(스탯 카드)처럼 카드 스케일 컨테이너 안에서만.
3. **타이포가 항상 주인공.** 셰이더는 `absolute inset-0 -z-10` + `aria-hidden`. 텍스트 중심부 대비 확보를 위해 필요 시 다크 스크림(`bg-[#1C1917]/40` 또는 radial mask)을 캔버스 위에 한 겹. BEYOND 의 `gradient-warm-text` 와 배경 오렌지가 뭉개지지 않는지 반드시 눈으로 검수.
4. **모션은 느리게.** `speed` 0.1~0.25. 움직임을 "인지"하는 게 아니라 "몇 초 보다가 알아채는" 수준. 간판이 아니라 공기.
5. **페이지당 라이브 캔버스 최대 2개.** 브라우저 WebGL 컨텍스트 상한(~8-16, 초과 시 오래된 컨텍스트 강제 소실) 대응. 그리드 카드마다 캔버스 절대 금지(블로그 썸네일은 §4-E 방식).
6. **framer-motion 래퍼로 캔버스를 감싸지 않는다.** 이 레포는 SafeHydration + framer-motion 조합으로 홈 LCP 10초 회귀 전력이 있음(미머지 `perf/lcp-hydration-boundary` 브랜치 참고). 캔버스 등장은 CSS opacity transition 으로만. `app/template.tsx` 페이지 전환과 이중 애니메이션 금지.
7. **폴백 3중화.** (a) SSR/프리하이드레이션: 기존 `.hero-glow` CSS 를 캔버스 밑에 상시 유지 → 캔버스는 mount 후 400~600ms 페이드인. (b) WebGL2 미지원: `document.createElement('canvas').getContext('webgl2')` 사전 감지 + error boundary, 실패 시 CSS 글로우로 종료. (c) `prefers-reduced-motion: reduce`: `speed={0}` 정적 프레임.
8. **모바일 예산.** `minPixelRatio` 기본값이 2 라 저사양 GPU 에서 비용 2배 — 모바일 브레이크포인트에서 `minPixelRatio={1}`. Lighthouse/실기기 검증에서 INP/TBT 저하 시 모바일은 `speed={0}` 정적 프레임으로 강등.
9. **/contact(광고 랜딩 통합 페이지)는 보수적으로.** Meta Pixel 전환 페이지이므로 마지막 페이즈에서 정적 프레임만 검토. 이 페이지의 수치/카피는 `meta-ads-automation/config/verified_numbers.json` 화이트리스트 게이트 대상 — 디자인 작업에서 카피 변경 금지.
10. **완료 선언 전 시각 검수.** Playwright 스크린샷(데스크톱 1440 + 모바일 390, 히어로/카드/CTA 각각) + Lighthouse before/after(LCP, CLS, TBT)를 PR 에 첨부. 홈 LCP 요소는 히어로 H1 텍스트로 유지되어야 한다.

## 4. 배치별 스펙 (파라미터 스타터)

값은 시작점이다. 구현 시 shaders.paper.design 플레이그라운드와 `meshGradientPresets` 류 내장 프리셋으로 미세 조정하되, §3 원칙 안에서.

### A. 홈 히어로 — GrainGradient (P1, 플래그십)

grain 텍스처가 Organic Warm 의 質感과 맞고, 다크 배경 밴딩을 자연스럽게 가려준다.

```tsx
<GrainGradient
  colorBack="#1C1917"
  colors={['#FF4500', '#F59E0B', '#7C2D12' /* ember 계열은 #FF4500 저명도 혼합으로 조정 가능 */]}
  softness={0.8}
  intensity={0.15}
  noise={0.3}
  speed={0.18}
  fit="cover"
  style={{ width: '100%', height: '100%' }}
/>
```

- 에너지 분포는 `originY`/`offsetY` 로 상단에 몰아 기존 hero-glow(상단 앵커) 인상을 계승.
- 대안: `MeshGradient` + `colors={['#1C1917','#1C1917','#FF4500','#F59E0B']}` (다크 2슬롯으로 어두운 면적 확보), `distortion 0.6 / swirl 0.2`.
- 주의: 세 번째 색 `#7C2D12` 는 토큰 외 hex 다. 채택하려면 MASTER.md 에 `--shader-ember-deep` 토큰으로 등록하고 쓸 것(§6). 등록이 싫으면 `#FF4500` + colorBack 혼합으로 대체.

### B. 서브페이지 히어로 — 동일 컴포넌트 파라미터 변주 (P2)

- 홈과 같은 `ShaderBackdrop` 을 쓰되 페이지별 `frame` 시드만 다르게 (예: service 12000, creator 34000, portfolio 56000...). 같은 시스템, 다른 컷.
- 서브 히어로는 높이가 낮으므로 `intensity`/발광 면적을 홈의 70% 수준으로.
- blog/careers/about 포함 전 서브페이지 일괄. 페이지당 캔버스 1개.

### C. Market Opportunity 스탯 카드 — MeshGradient (P2, 컬러 모먼트)

기존 `gradient-sunset`(#FF4500 → #F59E0B → #0D9488) 을 그대로 셰이더로.

```tsx
<MeshGradient
  colors={['#FF4500', '#F59E0B', '#0D9488']}
  distortion={0.6}
  swirl={0.3}
  speed={0.2}
  fit="cover"
  style={{ width: '100%', height: '100%', borderRadius: 16 }}
/>
```

- 카드 스케일 캔버스라 GPU 부담 작음. 홈에서 히어로와 동시에 화면에 들어오지 않는 위치라 컨텍스트 2개 제한과 양립(IntersectionObserver 로 화면 밖 `setSpeed(0)` 필수).
- 사이트 전체에서 teal 이 등장하는 유일한 지점이라는 현 상태를 유지한다.

### D. FinalCTA 밴드 (P2)

- 히어로와 동일 셰이더의 저강도 버전(`intensity` 절반, `speed 0.12`). 새 이펙트를 늘리지 말고 시스템 통일감으로.

### E. 블로그 인덱스 썸네일 — 정적 에셋 파이프라인 (P3)

- 라이브 캔버스 금지(카드 그리드). 대신 카테고리별 셰이더 프리셋(`speed=0` + 카테고리 고유 `frame`/`colors`)을 **오프라인에서 이미지로 구워** 정적 webp 에셋으로 커밋하거나 `/api/og` 를 확장.
- 카테고리 구분: 전문가 인사이트 / 업계 동향 등 기존 태그별로 톤 변주 (ember 단색 계열, amber 계열, teal 히든 카드 등).
- 효과: 로고 타일 반복 제거, 포스트별 고유성, GPU 비용 제로.

### F. 보류 (백로그)

- `PulsingBorder` 를 primary CTA hover 나 consult 폼 카드에 — 실험 슬롯. 기본은 미적용.
- `/contact` 히어로 정적 프레임 — Phase 4 에서 A/B 가능할 때만.
- `Dithering`/`PaperTexture` 를 크림 섹션 질감으로 — 저휘도 원칙과 충돌 없는지 별도 검토 전까지 보류.

## 5. 공용 래퍼 컴포넌트 (구현 스펙)

`components/ui/shader-backdrop.tsx` 하나로 모든 배치를 커버한다.

```
책임:
- WebGL2 feature-detect + error boundary → 실패 시 children 없이 CSS 폴백만
- prefers-reduced-motion 감지 → speed 0 강제
- IntersectionObserver → 뷰포트 밖 setSpeed(0), 복귀 시 원복 (ref.paperShaderMount API 사용)
- 모바일(≤ lg) minPixelRatio 1
- mount 후 opacity 0 → 1 페이드인 (CSS transition, framer-motion 금지)
- variant prop: 'hero' | 'hero-sub' | 'card' | 'cta' (배치별 파라미터 프리셋 내장)
- aria-hidden="true", absolute inset-0, z-index 는 부모 컨텍스트에서 -10
사용처는 기존 .hero-glow 클래스를 폴백 레이어로 유지한 채 그 위에 얹는다.
```

번들: `next/dynamic` + `ssr: false` 로 셰이더 청크를 크리티컬 번들에서 분리(패키지가 client 지만 코드 스플리팅 목적으로 유효).

## 6. 디자인 시스템 문서 동기화

구현 PR 에서 `design-system/MASTER.md` 에 "Shader Layer (v2.1)" 섹션을 추가할 것:

- 허용: 다크 섹션 배경(저휘도), 카드 스케일 컬러 모먼트, 정적 에셋 생성용
- 금지: 크림 섹션 배경, 카드 그리드 라이브 캔버스, 페이지당 3개 이상, framer-motion 래핑
- 앤티패턴 "전체 섹션 그라데이션 금지" 항목에 예외 조건(저휘도 셰이더는 hero-glow 의 후계로 허용) 명시
- 신규 토큰 등록 시(예: `--shader-ember-deep`) 여기서 함께

## 7. 페이즈 플랜 (후속 구현 세션용)

| Phase | 범위 | 게이트 |
|---|---|---|
| 0 | 패키지 설치(버전 핀) + `ShaderBackdrop` 래퍼 + 폴백 3종 + 단위 검증 | 데스크톱/모바일/reduced-motion/WebGL 차단 4케이스 스크린샷 |
| 1 | 홈 히어로(A) 적용 | Lighthouse before/after, LCP 요소 = H1 유지, 시각 검수 |
| 2 | 서브 히어로(B) + 스탯 카드(C) + FinalCTA(D) | 페이지당 캔버스 수 감사, 컨텍스트 소실 테스트(연속 페이지 이동) |
| 3 | 블로그 썸네일 정적 에셋 파이프라인(E) | 빌드 시간 영향, 에셋 용량 |
| 4 | 보류 항목(F) 재평가 + `/contact` 정적 프레임 검토 | 전환율 계측 가능할 때만 |

부수 작업(§1-2: 데드 코드, whileInView 튜닝, roadmap 여백)은 Phase 1~2 PR 에 끼워 처리.

## 8. 리스크 요약

- 0.0.x 라이브러리: 핀 고정으로 방어, 업그레이드는 의도적으로만.
- LCP 회귀 전력: §3-6/§3-7 준수가 방어선. 홈 히어로 PR 은 단독 배포로 분리해 롤백 용이하게.
- 광고 유입 모바일 트래픽: /contact 를 마지막에 둔 이유. 홈/서브는 오가닉 비중이 높아 리스크 낮음.
- 부대표님 감성 게이트: Phase 1 완료 시점에 홈 히어로 스크린샷/짧은 화면 녹화로 내부 컨펌 받고 Phase 2 진행 권장.
