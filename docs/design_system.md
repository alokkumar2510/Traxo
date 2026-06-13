# DESIGN_SYSTEM.md

# Traxo Design System v1.0

## Design Philosophy

Traxo is not an admin dashboard.

Traxo is a premium monitoring platform.

Every interaction should feel:

* Fast
* Elegant
* Luxurious
* Modern
* Responsive
* Addictive
* Enterprise-grade

Primary inspirations:

* Linear
* Arc Browser
* Stripe Dashboard
* Vercel
* Apple Vision Pro
* Framer
* Nothing OS

---

# Core Design Principles

## 1. Motion First

Motion is part of the product.

Every interaction should provide visual feedback.

Examples:

* Hover states
* Card expansion
* Page transitions
* Timeline updates

---

## 2. Information Hierarchy

Users should instantly see:

* What changed
* Where it changed
* When it changed

Everything else is secondary.

---

## 3. Dark Mode First

Traxo is designed primarily for dark mode.

Light mode is optional.

---

## 4. Glass + Depth

Use:

* Glassmorphism
* Layered surfaces
* Shadows
* Soft gradients

Avoid flat design.

---

# Color System

## Background Colors

### Primary Background

```css
#050505
```

### Secondary Background

```css
#0A0A0A
```

### Surface

```css
#111111
```

### Elevated Surface

```css
#18181B
```

---

## Text Colors

### Primary

```css
#FAFAFA
```

### Secondary

```css
#A1A1AA
```

### Muted

```css
#71717A
```

---

## Accent Colors

### Primary

```css
#3B82F6
```

### Purple

```css
#8B5CF6
```

### Cyan

```css
#06B6D4
```

---

## Status Colors

### Success

```css
#22C55E
```

### Warning

```css
#F59E0B
```

### Error

```css
#EF4444
```

### Info

```css
#3B82F6
```

---

# Gradient System

## Primary Gradient

```css
linear-gradient(
135deg,
#3B82F6,
#8B5CF6
)
```

---

## Secondary Gradient

```css
linear-gradient(
135deg,
#06B6D4,
#3B82F6
)
```

---

## Hero Gradient

```css
radial-gradient(
circle,
rgba(59,130,246,.4),
transparent
)
```

---

# Typography

## Fonts

### Primary

Geist

---

### Secondary

Inter

---

### Mono

JetBrains Mono

---

# Font Sizes

## Display

```css
72px
```

Used for hero headlines.

---

## H1

```css
48px
```

---

## H2

```css
36px
```

---

## H3

```css
24px
```

---

## Body

```css
16px
```

---

## Small

```css
14px
```

---

# Font Weights

## Regular

```css
400
```

## Medium

```css
500
```

## SemiBold

```css
600
```

## Bold

```css
700
```

---

# Spacing Scale

```css
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
96px
128px
```

Never use random spacing.

---

# Border Radius

## Small

```css
8px
```

---

## Medium

```css
16px
```

---

## Large

```css
24px
```

---

## XL

```css
32px
```

---

# Glass Effects

## Card Glass

```css
background:
rgba(255,255,255,0.03)

backdrop-filter:
blur(20px)

border:
1px solid rgba(255,255,255,0.08)
```

---

## Modal Glass

```css
background:
rgba(15,15,15,0.8)

backdrop-filter:
blur(40px)
```

---

# Shadow System

## Small

```css
0 4px 12px rgba(0,0,0,.2)
```

---

## Medium

```css
0 8px 24px rgba(0,0,0,.3)
```

---

## Large

```css
0 20px 60px rgba(0,0,0,.45)
```

---

## Glow

```css
0 0 30px rgba(59,130,246,.35)
```

---

# Layout System

## Desktop

```text
Sidebar
280px

Content
Fluid
```

---

## Mobile

Bottom Navigation

---

## Max Width

```css
1440px
```

---

# Motion System

## Duration

Fast

```css
150ms
```

---

Normal

```css
300ms
```

---

Slow

```css
500ms
```

---

# Easing

```css
cubic-bezier(
0.16,
1,
0.3,
1
)
```

---

# Hover Effects

## Cards

```css
translateY(-4px)
```

---

## Buttons

```css
scale(1.02)
```

---

## Icons

```css
rotate(3deg)
```

---

# Page Transitions

Use Framer Motion.

Every page should animate.

Example:

```css
opacity: 0
y: 20
```

↓

```css
opacity: 1
y: 0
```

---

# Component Specifications

# Buttons

## Primary

Gradient background.

Glow on hover.

Height:

```css
48px
```

---

## Secondary

Glass style.

Transparent.

Bordered.

---

# Cards

Default:

Glass card.

Padding:

```css
24px
```

---

Hover:

* Elevate
* Glow
* Smooth transition

---

# Inputs

Height:

```css
52px
```

---

Style:

Glass

Rounded

Soft border

---

Focus:

Blue glow.

---

# Tracker Card

Contains:

* Website Logo
* Tracker Name
* Status Badge
* Last Scan
* Change Count

---

Hover:

Expand slightly.

---

# Status Indicators

## Monitoring

Green pulse.

---

## Paused

Orange.

---

## Error

Red pulse.

---

# Timeline Component

Vertical timeline.

Glow line.

Animated appearance.

Grouped by:

* Today
* Yesterday
* Last Week

---

# Analytics Components

Use:

* Recharts

Charts:

* Area Chart
* Line Chart
* Bar Chart
* Heatmap

---

Animation:

On load.

---

# Loading States

Never use spinners.

Use:

* Skeletons
* Pulse placeholders
* Shimmer effects

---

# Empty States

Every empty state requires:

* Illustration
* Message
* CTA

Example:

"No trackers yet"

Button:

"Create Tracker"

---

# Icons

Use:

Lucide React

Avoid:

Emoji
Random SVG packs

---

# Animation Libraries

Required:

* Framer Motion
* Motion One

Optional:

* React Three Fiber
* OGL

---

# Accessibility

Minimum contrast:

WCAG AA

---

Keyboard navigation required.

---

Focus states required.

---

Screen reader labels required.

---

# Performance Rules

Avoid:

* Heavy blur stacking
* Massive box shadows
* Excessive animations

Target:

* Lighthouse 95+
* CLS < 0.1
* FCP < 1.5s

---

# Forbidden Design Patterns

Do NOT use:

* Bootstrap styles
* Material UI look
* Generic admin templates
* Excessive borders
* Bright white backgrounds

---

# Final User Feeling

Users should feel:

* In control
* Informed
* Productive
* Excited to check updates

Traxo should feel like a premium monitoring terminal rather than a traditional SaaS dashboard.
