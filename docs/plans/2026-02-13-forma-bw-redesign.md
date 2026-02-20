# KOREANERS Forma-Inspired B&W Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full visual redesign inspired by Squarespace Forma template — B&W palette, alternating section backgrounds, oversized condensed typography with italic accents, marquee dividers.

**Architecture:** Typography overhaul + section background alternation + marquee component + layout refinements across all landing page components.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion, Google Fonts (Bebas Neue, Playfair Display, Source Sans 3)

---

## Design System

### Colors
- Dark bg: `#000000` (pure black)
- Dark surface: `#111111`
- Light bg: `#FFFFFF` (white sections)
- Light surface: `#F5F5F5`
- Text on dark: `#FFFFFF`
- Text on light: `#000000`
- Muted on dark: `#888888`
- Muted on light: `#666666`
- Border on dark: `rgba(255,255,255,0.15)`
- Border on light: `rgba(0,0,0,0.15)`

### Typography
- Display: Bebas Neue (all-caps, condensed)
- Italic accent: Playfair Display Italic
- Body: Source Sans 3
- Japanese: Noto Sans JP (retained)

### Key Patterns
- Section bg alternates: black → white → black → white
- Marquee text dividers between sections
- Italic emphasis on key words in headings
- Large decorative numbering

## Section Layout

| # | Section | Background | Changes |
|---|---------|-----------|---------|
| 0 | Nav | transparent→black | Minimal, Bebas Neue logo text |
| 1 | Hero | BLACK | Bebas Neue clamp(3rem,10vw,10rem), italic accent word |
| 1.5 | Marquee | BLACK | New: "BEYOND AGENCY" rolling text divider |
| 2 | Market Opportunity | WHITE | Inverted: black text, black border cards |
| 3 | Barriers | BLACK | Dark cards, white text, refined |
| 4 | Solution Roadmap | WHITE | Inverted, oversized 01-04 numbering |
| 5 | Performance | BLACK | Portfolio carousel, refined |
| 5.5 | Marquee | BLACK | Rolling text divider |
| 6 | Final CTA | WHITE | Inverted, oversized stat numbers |
| 7 | Trust Signals | BLACK | Partner marquee retained |
| 8 | Footer CTA | BLACK | Form, Bebas Neue heading |
