# 21 — Component inventory

> **Type:** 🟢 Canonical component matrix · **Implementation status:** 🔵 Planned (every component is Planned; **Doc** and **Test** columns are "—" until built) · **Last reviewed:** 2026-07-14
> **Owns:** the maintainable component matrix. Update a component's **Status/Doc/Test** rows here when it is built; keep in sync with the component folders via [`tooling/check-inventory.mjs`](tooling/) (planned).
> **Related:** [`20-mvp-roadmap.md`](20-mvp-roadmap.md) · [`09-component-api-standard.md`](09-component-api-standard.md) · [`12`](12-accessibility-standard.md) · [`13`](13-performance-standard.md)
> **Legend:** Tier = Free/Premium · Stage = MVP/V1/V2/X(experimental) · risks L/M/H · Doc/Test = ✅ done / — not started.

## Matrix (MVP + near-term)

| Component | Category | Status | Tier | Stage | Primitives | Buyer value | A11y risk | Perf risk | Doc | Test | Target release |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MotionScene/MotionStep | Choreography | 🟡 spike | Premium | MVP | InView | semantic choreography (moat) | L | L | 🟡 | ✅ unit+timer+SSR+axe | v1.0 |
| MotionProvider | Foundation | 🔵 | Free | MVP | — | global config | — | L | — | — | v1.0 |
| [Reveal](components/reveal.md) | Foundation | 🟡 spike | Free | MVP | InView | scroll reveal | L | L | ✅ [page](components/reveal.md)+story | ✅ unit+SSR+axe | v1.0 |
| Fade/Slide/Scale | Foundation | 🔵 | Free | MVP | InView | entrances | L | L | — | — | v1.0 |
| [Stagger/StaggerItem](components/stagger.md) | Foundation | 🟡 spike | Free | MVP | InView | list entrance | L | L | ✅ [page](components/stagger.md) | ✅ unit+SSR+axe | v1.0 |
| [InView](components/in-view.md) | Foundation | 🟡 spike | Free | MVP | — | viewport trigger | L | L | ✅ [page](components/in-view.md) | ✅ unit+SSR+axe | v1.0 |
| ScrollProgress | Scroll | 🔵 | Free | MVP | useScroll | reading progress | L | L | — | — | v1.0 |
| [BlurReveal](components/blur-reveal.md) | Foundation | 🟡 spike | Premium | MVP | InView | headline | L | M | ✅ [page](components/blur-reveal.md) | ✅ unit+SSR | v1.0 |
| [AnimatedNumber/Counter](components/counter.md) | Text | 🟡 spike | Premium | MVP | InView | stats | L | L | ✅ [page](components/counter.md) | ✅ unit+timer+SSR | v1.0 |
| [TextReveal](components/text-reveal.md) | Text | 🟡 spike | Premium | MVP | InView | hero | L | M | ✅ [page](components/text-reveal.md) | ✅ unit+SSR+axe | v1.0 |
| [GradientText](components/gradient-text.md) | Text | 🟡 spike | Free | MVP | css | hero | L | L | ✅ [page](components/gradient-text.md) | ✅ unit+SSR+axe | v1.0 |
| [RotatingWords](components/rotating-words.md) | Text | 🟡 spike | Premium | MVP | — | hero | M | L | ✅ [page](components/rotating-words.md) | ✅ unit+timer+axe | v1.0 |
| AnimatedButton | Controls | 🔵 | Premium | MVP | motion | CTA | L | L | — | — | v1.0 |
| LoadingButton | Controls | 🔵 | Premium | MVP | — | forms | M | L | — | — | v1.0 |
| [SpotlightCard](components/spotlight-card.md) | Cards | 🟡 spike | Premium | MVP | pointer | pricing/feature | L | M | ✅ [page](components/spotlight-card.md) | ✅ unit+SSR+axe | v1.0 |
| [BentoGrid/Item](components/bento-grid.md) | Cards | 🟡 spike | Premium | MVP | Reveal | landing | L | L | ✅ [page](components/bento-grid.md) | ✅ unit+SSR+axe | v1.0 |
| [PricingCard](components/pricing-card.md) | Cards | 🟡 spike | Premium | MVP | Reveal | pricing | L | L | ✅ [page](components/pricing-card.md) | ✅ unit+SSR+axe | v1.0 |
| ImageReveal | Media | 🔵 | Premium | MVP | Reveal | gallery | L | M | — | — | v1.0 |
| [Dialog](components/dialog.md) | Overlay | 🟡 spike | Premium | MVP | Radix | modal | H | L | ✅ [page](components/dialog.md) | ✅ focus/esc+SSR+axe | v1.0 |
| [Drawer/Sheet](components/sheet.md) | Overlay | 🟡 spike | Premium | MVP | Radix | mobile nav | H | L | ✅ [page](components/sheet.md) | ✅ focus/esc+SSR+axe | v1.0 |
| [Tooltip](components/tooltip.md)/[Popover](components/popover.md) | Overlay | 🟡 spike | Premium | MVP | Radix | hints | M | L | ✅ [pages](components/tooltip.md) | ✅ interaction+axe | v1.0 |
| [Skeleton](components/skeleton.md) | Feedback | 🟡 spike | Free | MVP | css | loading | L | L | ✅ [page](components/skeleton.md) | ✅ unit+SSR+axe | v1.0 |
| [Marquee](components/marquee.md) | Media | 🟡 spike | Premium | MVP | css | logo cloud | M | M | ✅ [page](components/marquee.md) | ✅ unit+SSR+axe | v1.0 |
| [HeroSection](components/hero-section.md) | Section | 🟡 spike | Premium | MVP | Stagger/Reveal | landing | L | L | ✅ [page](components/hero-section.md) | ✅ slots+SSR+axe | v1.0 |
| [FeatureGrid](components/feature-grid.md) | Section | 🟡 spike | Premium | MVP | BentoGrid | landing | L | L | ✅ [page](components/feature-grid.md) | ✅ slots+SSR+axe | v1.0 |
| [CTASection](components/cta-section.md) | Section | 🟡 spike | Premium | MVP | Reveal | landing | L | L | ✅ [page](components/cta-section.md) | ✅ slots+SSR+axe | v1.0 |
| Magnetic | Controls | 🔵 | Premium | V1 | pointer | CTA delight | M | M | — | — | v1.1 |
| TiltCard | Cards | 🔵 | Premium | V1 | Tilt | product | M | M | — | — | v1.1 |
| BeforeAfter | Media | 🔵 | Premium | V1 | pointer | comparison | M | M | — | — | v1.1 |
| Toast | Feedback | 🔵 | Premium | V1 | Radix | notifications | H | L | — | — | v1.1 |
| CommandPalette | Nav | 🔵 | Premium | V1 | Radix/cmdk | ⌘K | H | M | — | — | v1.1 |
| Parallax | Scroll | 🔵 | Premium | V1 | useScroll | hero | M | **H** | — | — | v1.1 |
| BorderBeam / AnimatedGradient / Spotlight(bg) | FX | 🔵 | Premium | V1 | css/canvas | accents | L | M | — | — | v1.1 |
| KPICard / Stepper / Timeline / ActivityFeed | SaaS | 🔵 | Premium | V1 | Reveal/Presence | dashboards | M | L | — | — | v1.1 |
| HorizontalScroll | Scroll | 🔵 | Premium | V2 | useScroll | showcase | M | **H** | — | — | v2 |
| ScrollScrubbedText | Scroll | 🔵 | Premium | V2 | useScroll | storytelling | M | **H** | — | — | v2 |
| ParticleField | FX | 🔵 | Premium | X | canvas | hero bg | M | **H** | — | — | experimental |

> **Novelty/high-perf-risk items (ParticleField, HorizontalScroll, ScrollScrub) are gated to V2/experimental with mandatory mobile fallbacks** ([`13`](13-performance-standard.md)).
>
> **Spike note (2026-07-14):** Three primitives now exist in `@scope/motion` — `Reveal`, `InView`, and `Stagger`/`StaggerItem` — with **27 passing tests** (unit + SSR + axe), `publint`-clean exports, and `size-limit`-green budgets (Reveal 714 B, InView 489 B, Stagger 738 B, brotli; full index 1.22 kB). `Reveal` has a docs page + story; `InView`/`Stagger` still need docs pages + stories.
>
> `Reveal` exists in `@scope/motion` (CSS + IntersectionObserver, SSR-safe, reduced-motion) with **14 passing vitest tests** — unit + SSR + **3 axe a11y (WCAG 2.2 AA scope)** — a **CSF3 story**, and a **[docs page](components/reveal.md)**. It now meets the [motion-primitive Definition of Done](25-definition-of-done.md#motion-primitive) except: Storybook infra isn't stood up yet (story is written), and there is no performance *benchmark* number recorded. Its `@scope/motion` bundle is ~1.06 kB gzip (from the tsdown build). A demo `AnimatedButton` lives in `@scope/react` to exercise the react→motion boundary — a spike fixture, **not** a catalog component, intentionally omitted from this matrix.

## Full catalog scope (build-out reference)

The complete catalog (same columns) spans these areas; add rows as components are scheduled:

- **Foundations:** MotionProvider, ThemeProvider, motion presets, reduced-motion handling, animation inspector/debug util, motion tokens, transition utilities.
- **Buttons & controls:** AnimatedButton, LoadingButton, IconButton, MagneticButton, ShineButton, HoldToConfirmButton, SegmentedControl, AnimatedSwitch, AnimatedCheckbox/Radio, MorphingTabs.
- **Navigation:** AnimatedNavbar, MobileNav, MegaMenu, BreadcrumbTransition, TabNav, CommandPalette, AnimatedSidebar, DockNav, ScrollAwareHeader, PageTransitionWrapper.
- **Overlays & feedback:** Dialog, Drawer, Sheet, Popover, Tooltip, DropdownMenu, ContextMenu, Toast, Alert, Progress, Skeleton, EmptyState, Success/Error feedback.
- **Content & cards:** HoverCard, SpotlightCard, TiltCard, ExpandableCard, MorphingCard, ProductCard, PricingCard, TestimonialCard, ProfileCard, BlogCard, FeatureCard, BentoGridItem, ImageReveal, BeforeAfter, AnimatedCodeBlock.
- **Marketing sections:** Hero, FeatureGrid, Bento, LogoCloud, SocialProof, Stats, ProductShowcase, InteractiveDemo, Comparison, Pricing, Testimonials, FAQ, CTA, Newsletter, Footer, AnnouncementBanner.
- **Text & typography:** HeadlineReveal, WordStagger, CharacterStagger, TextScramble, Typewriter, RotatingWords, GradientText, HighlightSweep, MaskedTextReveal, Counter, NumberTicker, Countdown, KineticTypography.
- **Media:** ImageReveal, ImageComparison, AnimatedGallery, Carousel, Lightbox, VideoPlayerShell, DeviceMockup, BrowserMockup, ProductScreenshotSequence, HoverVideoPreview, AudioWaveform (where justified).
- **Scroll effects (optional, mobile-fallback-tested):** InViewReveal, ScrollProgress, ParallaxSection, StickyStorytelling, PinnedShowcase, HorizontalScrollGallery, ScrollLinkedTimeline, ScrollScrubbedText, SectionNavIndicator.
- **Data & SaaS (wrappers/integrations, not a full charting lib):** AnimatedKPICard, ChartEntranceWrapper, ActivityFeed, NotificationStack, ProgressTracker, Stepper, Timeline, KanbanCardTransition, FileUploadState, SearchResultsTransition, TableRowTransition, DashboardOnboarding.
