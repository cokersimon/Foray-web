# Technical Blueprint: Premium Health & Fitness Scrollytelling Architecture

Extracted from Bevel.health and Zentra — optimized for **Next.js**, **Tailwind CSS**, and **Framer Motion**.

---

## 1. Sticky mechanics — pinning the phone mockup

### Architecture (from Bevel)

The pattern uses a tall **track** container with `position: relative` that establishes the scrollable runway. Inside it, the phone frame uses `position: sticky; top: 0` and fills the full viewport height. Scroll trigger waypoints are placed at intervals as **1px-tall** `position: absolute` divs inside the track.

```
SECTION (outer wrapper)
└── TRACK (relative, height: ~830vh)
    ├── PHONE_FRAME (sticky, top: 0, height: 100vh) ← stays pinned
    ├── SCROLL_TRIGGER_1 (absolute, top: 0.3vh)
    ├── SCROLL_TRIGGER_2 (absolute, top: 2.3vh)
    ├── SCROLL_TRIGGER_3 (absolute, top: 4.3vh)
    ├── SCROLL_TRIGGER_4 (absolute, top: 6.3vh)
    └── SCROLL_TRIGGER_5 (absolute, top: 8.3vh)
```

### Recommended Next.js / Tailwind implementation

```tsx
{/* The scroll track — height determines total scroll distance */}
<section className="relative" style={{ height: '800vh' }}>

  {/* Sticky phone container — pinned to viewport */}
  <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-visible z-10">

    {/* Header text area (swaps per feature) */}
    <div className="text-center mb-12 max-w-2xl">
      {/* AnimatePresence swaps headlines here */}
    </div>

    {/* Phone + floating cards container */}
    <div className="relative w-full max-w-4xl mx-auto">

      {/* Phone mockup — centered */}
      <div className="relative mx-auto w-[280px] lg:w-[300px] z-20">
        <div className="overflow-hidden rounded-[3rem] border-[3px] border-neutral-300 bg-black shadow-xl shadow-black/10">
          {/* Dynamic Island */}
          <div className="relative flex justify-center pt-3 pb-2 bg-black">
            <div className="h-7 w-[100px] rounded-full bg-black border border-neutral-800" />
          </div>
          {/* Screen content — AnimatePresence swaps here */}
          <div className="aspect-[9/17.5] overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Active screen component */}
            </AnimatePresence>
          </div>
          {/* Home indicator */}
          <div className="flex justify-center bg-black pb-3 pt-2">
            <div className="h-1 w-32 rounded-full bg-neutral-700" />
          </div>
        </div>
      </div>

      {/* Floating bento cards layer — positioned behind phone */}
      <div className="absolute inset-0 z-[1]">
        {/* Cards animate in/out per section */}
      </div>
    </div>
  </div>
</section>
```

### Key measurements (from Bevel)

| Element | Value |
|--------|--------|
| Total section height | ~830vh (~200vh per feature step) |
| Phone frame | `sticky`, `top: 0`, `height: 100vh` |
| Phone mockup width (desktop) | 280–300px |
| Phone border radius | `rounded-[3rem]` (48px) |
| Phone border | 3px solid `neutral-300` |
| Phone shadow | `shadow-xl shadow-black/10` |
| Container | max-width **1280px**, horizontal padding **40px** |

### Alternative approach (from Zentra — 2-column layout)

```tsx
<section className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
  {/* Left: Scrollable text sections */}
  <div className="px-6 lg:px-12">
    {features.map(feature => (
      <div key={feature.id} className="flex min-h-screen flex-col justify-center py-24">
        {/* Feature label, title, description */}
      </div>
    ))}
  </div>

  {/* Right: Sticky phone */}
  <div className="hidden lg:flex lg:items-center">
    <div className="sticky top-1/2 w-full -translate-y-1/2 py-24">
      {/* Phone mockup */}
    </div>
  </div>
</section>
```

---

## 2. Bento card animations — Framer Motion config

### Extracted animation values (Bevel GSAP → Framer Motion)

Bevel uses GSAP with ScrollTrigger (`scrub: 1`) and `power3.out` easing. Cards animate from `opacity: 0` with position offsets to `opacity: 1` at their final position with slight rotations.

### `useScroll` + `useTransform` setup

```tsx
import { useScroll, useTransform, motion, useSpring } from 'framer-motion';

// In your component:
const targetRef = useRef(null);
const { scrollYProgress } = useScroll({
  target: targetRef,
  offset: ["start start", "end end"]
});

// Smooth the scroll progress (equivalent to GSAP scrub: 1)
const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001
});
```

### Per-card animation values (reusable variant)

```tsx
// Bento card animation variant (generic reusable)
const floatingCardVariants = {
  hidden: {
    opacity: 0,
    y: 60,        // Start 60px below
    scale: 0.85,  // Slightly smaller
    rotate: 0,    // No rotation initially
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,    // Slight rotation at final position (varies per card)
    transition: {
      duration: 1.1,
      ease: [0.33, 1, 0.68, 1], // power3.out equivalent
    }
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.9,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1],
    }
  }
};
```

### Rotation values per card position (from Bevel)

```tsx
// Cards around the phone get slight tilts for organic feel
const cardRotations = {
  topLeft:     -10,  // rotate(-10deg)
  middleLeft:  -4,   // rotate(-4deg)
  topRight:     4,   // rotate(4deg)
  middleRight:  6,   // rotate(6deg)
  bottomLeft:  10,   // rotate(10deg)
  bottomRight:  7,   // rotate(7deg)
};
```

### Scroll-linked implementation (`useTransform`)

```tsx
// Example: Feature 1 cards appear from 0% to 12.5% of scroll, stay until 25%
// Feature 2 cards: 25% to 37.5%, stay until 50%, etc.

function FeatureCards({ scrollProgress, featureIndex, totalFeatures }) {
  const sectionSize = 1 / totalFeatures;
  const start = featureIndex * sectionSize;
  const animateIn = start + sectionSize * 0.15;   // Cards animate in first 15%
  const holdEnd = start + sectionSize * 0.85;     // Hold for the middle
  const animateOut = start + sectionSize;          // Animate out last 15%

  const opacity = useTransform(
    scrollProgress,
    [start, animateIn, holdEnd, animateOut],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollProgress,
    [start, animateIn, holdEnd, animateOut],
    [60, 0, 0, -40]
  );

  const scale = useTransform(
    scrollProgress,
    [start, animateIn, holdEnd, animateOut],
    [0.85, 1, 1, 0.9]
  );

  return (
    <motion.div style={{ opacity, y, scale }}>
      {/* Card content */}
    </motion.div>
  );
}
```

### Header / title crossfade (Bevel `phone_header` style)

```tsx
// Headers use a grid overlay system — all stacked in same position
// Active header: opacity 1, others: opacity 0
const headlineOpacity = useTransform(
  scrollProgress,
  [start, start + 0.02, holdEnd, animateOut],
  [0, 1, 1, 0]
);
```

### Stagger pattern for multiple cards

```tsx
// Bevel staggers cards with 0.05s delays (all duration 1.1s, same ease)
// In Framer Motion, offset the scroll input ranges slightly per card:
function createCardTransforms(scrollProgress, baseStart, baseEnd, cardIndex) {
  const staggerOffset = cardIndex * 0.008; // ~0.8% scroll per card stagger
  return {
    opacity: useTransform(scrollProgress,
      [baseStart + staggerOffset, baseEnd + staggerOffset],
      [0, 1]
    ),
    y: useTransform(scrollProgress,
      [baseStart + staggerOffset, baseEnd + staggerOffset],
      [60, 0]
    ),
  };
}
```

---

## 3. Glassmorphism 2.0 — premium bento card styling

### Light theme cards (from Zentra’s bento grid)

```tsx
// Standard bento card
<div className="
  group
  relative
  overflow-hidden
  rounded-3xl
  border border-neutral-200
  bg-white
  p-8
  shadow-sm
  transition-all
  hover:border-neutral-300
  hover:shadow-md
">
  {/* Card content */}
</div>
```

**Computed breakdown:** `rounded-3xl` = 24px radius; `border-neutral-200` = 1px solid `rgba(229,229,229)`; `shadow-sm` ≈ `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)`.

### Glassmorphic navbar (from Zentra)

```tsx
<nav className="
  fixed top-4 left-1/2 z-50
  w-[92%] max-w-2xl
  -translate-x-1/2
  rounded-full
  border border-white/10
  bg-white/70
  shadow-lg shadow-black/[0.03]
  backdrop-blur-md
">
```

**Computed:** `bg-white/70` = `rgba(255,255,255,0.7)`; `backdrop-blur-md` = `blur(12px)`; `border-white/10` ≈ light border on white (use as design token in context).

### Dark theme / premium floating cards

```tsx
// Glass card on dark background
<motion.div className="
  relative
  overflow-hidden
  rounded-2xl
  border border-white/[0.08]
  bg-white/[0.05]
  p-6
  shadow-2xl shadow-black/20
  backdrop-blur-xl
">
  {/* Optional inner glow */}
  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
  {/* Content */}
</motion.div>
```

### 3D depth card (elevated premium variant)

```tsx
// Multi-shadow for 3D depth illusion
<motion.div className="
  relative
  overflow-hidden
  rounded-[20px]
  border border-white/10
  bg-white/[0.06]
  p-6
  backdrop-blur-2xl
  [box-shadow:0_0_0_1px_rgba(255,255,255,0.05)_inset,0_2px_4px_rgba(0,0,0,0.1),0_12px_40px_rgba(0,0,0,0.15),0_0_80px_rgba(0,0,0,0.05)]
">
```

### Recommended Tailwind config extensions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255, 255, 255, 0.7)',
        border: 'rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',  // 40px — matches Bevel preview cards
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'bento': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'bento-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      },
    },
  },
};
```

> **Note:** If this repo uses Tailwind v4, prefer CSS theme variables or `@theme` instead of `tailwind.config.js` — map the same tokens there.

---

## 4. Spacing and scroll breathing room

### Bevel scroll trigger spacing

- Total phone section height: **~830vh** (example: ~5934px at 715px viewport).
- Scroll triggers spaced **200vh** apart (~1430px).
- Each feature gets **2 full viewport heights** of scroll distance.
- First trigger **30vh** from section top (intro breathing room).
- Subsequent triggers at **230vh, 430vh, 630vh, 830vh**.

### Zentra section spacing

- Each feature panel: `min-h-screen` with `py-24` (96px vertical padding).
- Roughly **one full viewport** of scroll per feature in the text column.

### Recommended spacing for your site

```tsx
// OPTION A: Full-page scrollytelling (Bevel-style)
// 4 features × 200vh per feature = 800vh total
<section className="relative" style={{ height: `${numFeatures * 200}vh` }}>
  <div className="sticky top-0 h-screen ...">
    {/* Phone + cards */}
  </div>
</section>

// OPTION B: 2-column layout (Zentra-style)
// Each feature section is min-h-screen with generous padding
<div className="flex min-h-screen flex-col justify-center py-24">
  {/* Feature content */}
</div>
```

### Section-to-section transitions

- Bevel uses **0px margin** between major sections; tall scroll tracks supply breathing room.
- After the phone section (~830vh), the last feature’s card exit supplies ~**100vh** of perceived transition.
- Between major sections in your build, consider **`py-32`** (128px) or **`py-40`** (160px).

### Inner content spacing (reference)

- Bevel phone inner: padding-top **88px**, gap **48px**.
- Bevel container: max-width **1280px**, horizontal padding **40px**.
- Zentra container: `max-w-7xl` (1280px), feature text: `px-6 lg:px-12`.
- Preview cards: **60px** internal padding, **40px** border radius.

---

## 5. Complete component scaffold

```tsx
// ScrollytellingSection.tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

const FEATURES = [
  { id: 'recovery', title: 'Smarter Recovery', subtitle: '...' },
  { id: 'nutrition', title: 'Fuel Your Body', subtitle: '...' },
  { id: 'sleep', title: 'Dial In Your Sleep', subtitle: '...' },
  { id: 'fitness', title: 'Train Smarter', subtitle: '...' },
];

const EASE_POWER3_OUT = [0.33, 1, 0.68, 1] as const;

export function ScrollytellingSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Determine active feature index from scroll progress
  const sectionSize = 1 / FEATURES.length;

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${FEATURES.length * 200}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-visible">

        {/* Headline area */}
        <div className="text-center mb-12 max-w-2xl px-6">
          {FEATURES.map((feature, i) => (
            <FeatureHeadline
              key={feature.id}
              feature={feature}
              index={i}
              scrollProgress={smoothProgress}
              sectionSize={sectionSize}
            />
          ))}
        </div>

        {/* Phone + cards */}
        <div className="relative w-full max-w-5xl mx-auto">
          <PhoneMockup scrollProgress={smoothProgress} />
          {FEATURES.map((feature, i) => (
            <FloatingCards
              key={feature.id}
              featureIndex={i}
              scrollProgress={smoothProgress}
              sectionSize={sectionSize}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureHeadline({ feature, index, scrollProgress, sectionSize }) {
  const start = index * sectionSize;
  const fadeIn = start + sectionSize * 0.05;
  const holdEnd = start + sectionSize * 0.85;
  const fadeOut = start + sectionSize * 0.95;

  const opacity = useTransform(scrollProgress, [start, fadeIn, holdEnd, fadeOut], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [start, fadeIn], [20, 0]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{feature.title}</h2>
      <p className="mt-4 text-lg text-neutral-500">{feature.subtitle}</p>
    </motion.div>
  );
}

function FloatingCards({ featureIndex, scrollProgress, sectionSize }) {
  const start = featureIndex * sectionSize;
  const cardsIn = start + sectionSize * 0.08;
  const holdEnd = start + sectionSize * 0.82;
  const cardsOut = start + sectionSize * 0.95;

  // Per-card positions and rotations
  const cardPositions = [
    { className: 'top-[10%] left-[5%]',  rotate: -10, stagger: 0 },
    { className: 'top-[30%] left-[0%]',  rotate: -4,  stagger: 1 },
    { className: 'top-[10%] right-[5%]', rotate: 4,   stagger: 2 },
    { className: 'top-[30%] right-[0%]', rotate: 6,   stagger: 3 },
    { className: 'bottom-[15%] left-[8%]', rotate: 10, stagger: 4 },
    { className: 'bottom-[15%] right-[8%]', rotate: 7, stagger: 5 },
  ];

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none">
      {cardPositions.map((card, i) => {
        const staggerOffset = card.stagger * 0.008;
        const opacity = useTransform(scrollProgress,
          [start + staggerOffset, cardsIn + staggerOffset, holdEnd, cardsOut],
          [0, 1, 1, 0]
        );
        const y = useTransform(scrollProgress,
          [start + staggerOffset, cardsIn + staggerOffset, holdEnd, cardsOut],
          [60, 0, 0, -40]
        );
        const scale = useTransform(scrollProgress,
          [start + staggerOffset, cardsIn + staggerOffset, holdEnd, cardsOut],
          [0.85, 1, 1, 0.9]
        );

        return (
          <motion.div
            key={i}
            className={`absolute ${card.className} w-[180px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm`}
            style={{
              opacity,
              y,
              scale,
              rotate: card.rotate,
            }}
          >
            {/* Card content: icon, label, value */}
          </motion.div>
        );
      })}
    </div>
  );
}
```

> **Implementation notes:** Wire up `PhoneMockup`, add proper TypeScript types for props, and ensure the headline stack uses a **relative** parent with **min-height** so absolutely positioned headlines do not collapse. Extract hooks that call `useTransform` into subcomponents or custom hooks to satisfy the Rules of Hooks if you iterate cards dynamically.

---

## 6. Smooth scroll config (Lenis equivalent)

Bevel uses [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling. For Next.js, install `lenis` and use the React integration:

```tsx
// app/layout.tsx or a SmoothScrollProvider
'use client';
import { ReactLenis } from 'lenis/react';

export function SmoothScrollProvider({ children }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,       // Smoothness (0.1 = smooth, 1 = instant)
        duration: 1.2,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
```

---

## Quick reference cheat sheet

| Property | Value |
|----------|--------|
| Section height per feature | 200vh |
| Sticky container | `sticky top-0 h-screen` |
| 2-col sticky (alt) | `sticky top-1/2 -translate-y-1/2 py-24` |
| Phone width (desktop) | 280–300px |
| Phone border-radius | `rounded-[3rem]` (48px) |
| Phone border | 3px solid neutral-300 |
| Phone shadow | `shadow-xl shadow-black/10` |
| Card border-radius | `rounded-3xl` (24px) or `rounded-2xl` (16px) |
| Card border | `border border-neutral-200` |
| Card shadow | `shadow-sm` → hover: `shadow-md` |
| Card padding | `p-8` (32px) or `p-6` (24px) |
| Glass bg | `bg-white/70 backdrop-blur-md` |
| Dark glass bg | `bg-white/[0.05] backdrop-blur-xl border-white/[0.08]` |
| Card enter opacity | 0 → 1 |
| Card enter translateY | 60px → 0 |
| Card enter scale | 0.85 → 1 |
| Card exit opacity | 1 → 0 |
| Card exit translateY | 0 → -40px |
| Card exit scale | 1 → 0.9 |
| Animation duration | 1.1s |
| Easing | `power3.out` ≈ `[0.33, 1, 0.68, 1]` cubic-bezier |
| Card rotations | -10° to +10° |
| Stagger | ~0.05s between cards or ~0.8% scroll offset |
| Lenis lerp | 0.1 |
| Container max-width | 1280px (`max-w-7xl`) |
| Horizontal padding | 40px (`px-10`) |
| Feature text padding | `py-24` (96px) for 2-col, or baked into 200vh track |

---

*Document version: initial blueprint export. Adjust numbers and tokens to match your design system and Next.js / Tailwind version.*
