# Design System Global Application Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the Exaggerated Minimalism design system consistently across all pages (portfolio, blog, service, creator, careers)

**Architecture:** Batch color/font token replacements per file, then per-page specific fixes (gradients, shadows, primary→accent). Each page is an independent task.

**Tech Stack:** Next.js 16, Tailwind CSS 4

---

## Design System Token Mapping

```
OLD                        → NEW
bg-zinc-900                → bg-[#141414]
bg-zinc-800                → bg-[#111]
bg-zinc-800/50             → bg-[#111]/50
bg-zinc-800/30             → bg-[#111]/30
border-zinc-700/50         → border-white/10
border-zinc-600            → border-white/20
text-zinc-200              → text-white/80
text-zinc-300              → text-white/60
text-zinc-400              → text-white/40
text-zinc-500              → text-white/50
text-zinc-600              → text-white/30
font-black                 → font-bold
radial-gradient(...)       → REMOVE (delete the entire div)
bg-gradient-to-br/to-b/... → REMOVE or replace with flat color
shadow-[0_0_24px_*]        → REMOVE
shadow-[0_0_8px_*]         → REMOVE
rounded-lg                 → rounded-none
rounded-md                 → rounded-none
rounded-full (badges/bars) → rounded-none (keep for loading spinners)
bg-primary/*               → bg-[#FF4500]/* or bg-white/10
text-primary               → text-[#FF4500]
border-primary/*           → border-[#FF4500]/*
hover:bg-zinc-100          → hover:bg-white/90
hover:bg-zinc-700          → hover:bg-white/10
via-zinc-800/30            → REMOVE (flatten)
via-zinc-500               → REMOVE (flatten)
animate-pulse-subtle       → REMOVE
```

---

### Task 1: Portfolio List Page

**Files:**
- Modify: `app/portfolio/page.tsx`

**Step 1: Apply token replacements**

Replace all instances (replace_all=true for each):
- `font-black` → `font-bold`
- `bg-zinc-900` → `bg-[#141414]`
- `bg-zinc-800/50` → `bg-[#111]/50`
- `bg-zinc-800` → `bg-[#111]`
- `border-zinc-700/50` → `border-white/10`
- `text-zinc-200` → `text-white/80`
- `text-zinc-400` → `text-white/40`
- `text-zinc-600` → `text-white/30`

**Step 2: Remove radial-gradient overlay div**

Delete the entire line:
```tsx
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]" />
```

**Step 3: Verify build**

Run: `npx next build`

**Step 4: Commit**

```bash
git add app/portfolio/page.tsx
git commit -m "refactor: apply design system to portfolio list page"
```

---

### Task 2: Portfolio Detail Page

**Files:**
- Modify: `app/portfolio/[id]/page.tsx`

**Step 1: Apply token replacements**

Same mapping as Task 1:
- `font-black` → `font-bold`
- `bg-zinc-900` → `bg-[#141414]`
- `bg-zinc-800/50` → `bg-[#111]/50`
- `bg-zinc-800` → `bg-[#111]`
- `border-zinc-700/50` → `border-white/10`
- `text-zinc-200` → `text-white/80`
- `text-zinc-400` → `text-white/40`
- `text-zinc-600` → `text-white/30`

**Step 2: Verify build, commit**

---

### Task 3: Blog List Page

**Files:**
- Modify: `app/blog/page.tsx`

**Step 1: Apply token replacements**

Same mapping + remove radial-gradient div.

**Step 2: Verify build, commit**

---

### Task 4: Blog Detail (blog-post-view.tsx)

**Files:**
- Modify: `components/blog/blog-post-view.tsx`

**Step 1: Apply token replacements**

Same mapping.

**Step 2: Verify build, commit**

---

### Task 5: Service Page (HEAVY — most violations)

**Files:**
- Modify: `app/service/page.tsx`

**Step 1: Apply standard token replacements**

**Step 2: Remove radial-gradient overlay div (line ~56)**

**Step 3: Replace gradient section background**
```
bg-gradient-to-br from-zinc-900 via-zinc-800/30 to-zinc-900
→ bg-[#141414]
```

**Step 4: Remove ALL shadow glow effects**
```
hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] → (delete)
shadow-[0_0_8px_rgba(0,255,255,0.3)] → (delete)
```

**Step 5: Replace primary color tokens**
```
bg-primary/5   → bg-white/5
bg-primary/10  → bg-white/10
bg-primary/15  → bg-white/10
bg-primary/20  → bg-[#FF4500]/20
bg-primary/30  → bg-[#FF4500]/20
bg-primary     → bg-[#FF4500]
bg-primary/80  → bg-[#FF4500]/80
bg-primary/60  → bg-[#FF4500]/60
text-primary   → text-[#FF4500]
border-primary/10 → border-white/10
border-primary/20 → border-[#FF4500]/20
border-primary/30 → border-[#FF4500]/20
```

**Step 6: Replace rounded-lg/md/full with rounded-none**

Progress bars:
```
rounded-full → rounded-none (on progress bars and dots)
rounded-lg   → rounded-none
rounded-md   → rounded-none
```

Keep `rounded-full` ONLY for tiny bullet dots (w-1.5 h-1.5).

**Step 7: Remove hover:-translate-y-2, keep hover:-translate-y-1 max**

**Step 8: Verify build, commit**

---

### Task 6: Creator Page (HEAVY)

**Files:**
- Modify: `app/creator/page.tsx`

**Step 1: Apply standard token replacements**

**Step 2: Remove radial-gradient overlay div (line ~214)**

**Step 3: Replace gradient backgrounds**
```
bg-gradient-to-br from-primary/20 to-primary/5 → bg-[#111]
bg-gradient-to-b from-transparent to-zinc-900/80 → bg-gradient-to-b from-transparent to-[#141414]/80
```

**Step 4: Replace primary color tokens** (same mapping as Task 5)

**Step 5: Replace rounded-full for SNS icons**

Social media link icons: `rounded-full` → `rounded-none`
Keep `rounded-full` for loading spinners only.

**Step 6: Remove shadow glow on CTA button**
```
shadow-[0_0_24px_rgba(255,255,255,0.35)] → (delete)
hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] → (delete)
animate-pulse-subtle → (delete)
```

**Step 7: Verify build, commit**

---

### Task 7: Careers Page

**Files:**
- Modify: `app/careers/page.tsx`

**Step 1: Apply standard token replacements**

**Step 2: Remove radial-gradient overlay div (line ~124)**

**Step 3: Replace gradient divider**
```
bg-gradient-to-r from-transparent via-zinc-500 to-transparent → bg-white/10
```

**Step 4: Replace bg-zinc-800/30 section backgrounds**
```
bg-zinc-800/30 → bg-[#111]/30
```

**Step 5: Remove shadow glow effects**
```
hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] → (delete)
```

**Step 6: Verify build, commit**

---

### Task 8: Final Verification

**Step 1: Full build**
Run: `npx next build`

**Step 2: Visual grep for remaining violations**
```bash
grep -rn "font-black\|bg-zinc\|text-zinc\|rounded-lg\|rounded-md\|gradient\|shadow-\[0" app/ components/ --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

**Step 3: Fix any remaining issues**

**Step 4: Commit all remaining fixes**
