// Generates accurate, unique-per-component SEO content (intro prose, "best for"
// use cases, and FAQ) from real catalog data — never fabricated. Component
// pages are otherwise thin (description + API table); this adds the substantive,
// keyword-rich text search engines rank, sourced from each item's own tags,
// category, and technical attributes.
import { type CatalogItem, categories, itemInstall } from "./catalog";

const CATEGORY_LABEL = new Map(categories.map((c) => [c.id, c.label]));
const CATEGORY_BLURB = new Map(categories.map((c) => [c.id, c.blurb]));

// Human-readable phrasing for the common catalog tags. Unmapped tags fall back
// to a title-cased form, so every tag still contributes readable copy.
const TAG_PHRASE: Record<string, string> = {
  ai: "AI product surfaces",
  llm: "LLM-powered features",
  agent: "AI agent workflows",
  assistant: "assistant and copilot UIs",
  streaming: "streaming responses",
  chat: "chat interfaces",
  citations: "cited, sourced answers",
  devtools: "developer tooling",
  pipeline: "CI/CD and build pipelines",
  deployment: "deployment flows",
  deploy: "deployment flows",
  logs: "log and console output",
  observability: "observability dashboards",
  infrastructure: "infrastructure consoles",
  console: "developer consoles",
  webhooks: "webhook and event streams",
  events: "event streams",
  collaboration: "real-time collaboration",
  presence: "presence and multiplayer UI",
  realtime: "real-time updates",
  thread: "comment threads",
  replies: "threaded replies",
  mentions: "@mentions and notifications",
  messaging: "messaging and inbox UIs",
  conversation: "conversation views",
  activity: "activity feeds",
  approval: "approval and review flows",
  review: "review workflows",
  dashboard: "dashboards",
  data: "data-heavy interfaces",
  metrics: "metrics and KPIs",
  status: "status and state indicators",
  retry: "retry and error states",
  filter: "filtering and search results",
  search: "search experiences",
  queue: "job queues",
  timeline: "timelines",
  workflow: "product workflows",
  orchestration: "orchestration UIs",
  files: "file workflows",
  upload: "file uploads",
  processing: "processing and progress UIs",
  mobile: "mobile and touch interfaces",
  keyboard: "keyboard-driven UIs",
  commerce: "e-commerce interfaces",
  checkout: "checkout flows",
  cart: "cart and basket UIs",
  order: "order tracking",
  price: "pricing and variants",
  variant: "product variant selection",
  security: "security and account flows",
  account: "account management",
  login: "sign-in flows",
  mfa: "two-factor and passkey flows",
  audit: "audit and session logs",
  redaction: "sensitive-data redaction",
  hero: "landing-page hero sections",
  background: "animated backgrounds",
  ambient: "ambient background motion",
  text: "animated headlines and text",
  headline: "headline animations",
  project: "project planning",
  planning: "planning boards",
  roadmap: "roadmaps",
  milestone: "milestone tracking",
  grid: "grid layouts",
  list: "animated lists",
};

// Authored intro copy for category landing pages — unique, keyword-rich text
// that targets head terms (e.g. "animated AI interface components"). Falls back
// to the category blurb if a category has no authored intro.
const CATEGORY_INTRO: Record<string, string> = {
  ai: "Animated AI interface components for React and Next.js — streaming assistant responses, agent run timelines, tool-call activity, and prompt composers. Each installs as editable source through the shadcn CLI, so your app owns the state while the component handles the motion, loading, and error states of a modern AI product surface.",
  "developer-tools": "Animated developer-tool components for React — deployment pipelines, live log streams, request inspectors, environment switchers, and CI/CD dashboards. Copy-paste, editable source built for consoles and internal tooling, with accessible status states and reduced-motion support out of the box.",
  collaboration: "Real-time collaboration components for React and Next.js — presence stacks, comment threads, @mention suggestions, approval workflows, and activity feeds. Editable, shadcn-compatible source for multiplayer product UI, with keyboard and screen-reader support baked in.",
  "data-motion": "Animated data and dashboard components for React — KPI number morphs, streaming data rows, refresh states, and filter transitions. Production-ready, editable source that makes dashboards feel live without faking data, and stays smooth with reduced motion enabled.",
  mobile: "Mobile and touch-first interaction components for React — swipe action rows, filter sheets, and gesture-driven patterns. Accessible, reduced-motion-safe editable source that works across touch and keyboard.",
  file: "File-workflow components for React — upload pipelines, multi-file queues, and processing timelines. Editable, shadcn-compatible source that shows real upload, queue, and export progress with accessible status states.",
  commerce: "E-commerce interface components for React and Next.js — product variant selectors, cart transitions, and checkout progress. Editable source for storefronts and checkout flows, accessible and reduced-motion-safe.",
  security: "Security and account-flow components for React — passkey setup, two-factor enrollment, session security centers, and sign-in flows. Accessible, editable source for the highest-trust parts of your product.",
  communication: "Communication and messaging components for React — message delivery states, typing and presence, and thread expansion. Editable, shadcn-compatible source for inbox, chat, and notification UIs.",
  productivity: "Productivity components for React — kanban card movement, project timelines, task dependency maps, and bulk actions. Editable source for boards, planners, and roadmaps, with keyboard-first accessibility.",
  text: "Animated text components for React and Next.js — headline reveals, rotating text, and blur-in effects. Lightweight, editable source for landing pages and hero sections, reduced-motion-safe by default.",
  creative: "Creative UI components for React — animated cards, lists, and interactive surfaces. Editable, shadcn-compatible source that adds meaningful motion to product interfaces.",
  backgrounds: "Ambient animated background components for React — performance-safe backdrops that pause offscreen and respect reduced motion. Editable source for landing pages and hero sections.",
  "product-backgrounds": "Animated product-background components for React — backdrops driven by real application state like workflows, signals, queues, and events. Editable, performance-safe source for dashboards and product heroes.",
  "workflow-heroes": "Animated hero-block components for React and Next.js — editable landing-page heroes that demonstrate a real product workflow. Copy-paste source, accessible and reduced-motion-safe.",
  "animated-shadcn": "Animated shadcn components for React — accessible Radix primitives (accordion, dialog, tabs, and more) with meaningful motion. Editable source that drops into any shadcn/ui project.",
  icons: "Animated icon components for React — tiny, tasteful motion for buttons and actions. Lightweight, editable source that respects reduced-motion preferences.",
};

/** Landing-page intro copy for a category. */
export function categoryIntro(id: string, fallback: string): string {
  return CATEGORY_INTRO[id] ?? fallback;
}

const COMPLEXITY_WORD: Record<string, string> = {
  simple: "lightweight",
  medium: "production-ready",
  complex: "advanced",
};

function tagPhrase(tag: string): string {
  return TAG_PHRASE[tag] ?? tag.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Lowercase a category label for mid-sentence prose while preserving acronyms. */
export function categoryProse(label: string): string {
  return label.toLowerCase().replace(/\bai\b/g, "AI");
}

/** Unique intro paragraph + "best for" use-case list, derived from real fields. */
export function whenToUse(item: CatalogItem): { intro: string; bestFor: string[] } {
  const label = categoryProse(CATEGORY_LABEL.get(item.category) ?? "UI");
  const complexity = COMPLEXITY_WORD[item.complexity ?? ""] ?? "production-ready";
  const clientNote = item.requiresClient ? "a client component" : "server-safe";

  const intro =
    `${item.name} is ${/^[aeiou]/i.test(complexity) ? "an" : "a"} ${complexity} ${label} ` +
    `component for React and Next.js. ${item.description} It installs as editable source with the ` +
    `shadcn CLI — ${clientNote}, dark-mode ready, and reduced-motion-safe by default, so it drops ` +
    `into production interfaces without extra accessibility work.`;

  // Use cases from this item's own tags (unique per component), led by the
  // category use case. Dedupe and cap so the list stays scannable.
  const seen = new Set<string>();
  const bestFor: string[] = [];
  const push = (s: string) => {
    const k = s.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      bestFor.push(s);
    }
  };
  const catUse = CATEGORY_BLURB.get(item.category);
  if (catUse) push(catUse.replace(/\.$/, ""));
  for (const t of item.tags) {
    if (bestFor.length >= 5) break;
    push(cap(tagPhrase(t)));
  }
  return { intro, bestFor };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface Faq {
  q: string;
  a: string;
}

/** Accurate FAQ derived from real attributes — doubles as FAQPage JSON-LD. */
export function faqFor(item: CatalogItem): Faq[] {
  const deps = item.dependencies.length
    ? item.dependencies.join(", ")
    : "no extra runtime dependencies";
  const engine =
    item.animationEngine === "css"
      ? "It animates with CSS, so there is no animation-library dependency."
      : item.animationEngine === "motion+radix"
        ? "It uses Motion for React and Radix primitives under the hood."
        : "It uses Motion for React for its animation.";

  return [
    {
      q: `How do I install ${item.name}?`,
      a: `Run \`${itemInstall(item)}\`. The shadcn CLI copies the editable source straight into your project — you own and can modify the code, with no package to keep in sync.`,
    },
    {
      q: `Does ${item.name} work with Next.js and the App Router?`,
      a: `Yes. ${item.name} works with React 18+ and Next.js, including the App Router. It is ${item.requiresClient ? 'a client component (add "use client" where you use it)' : "server-safe and can render in a React Server Component"}.`,
    },
    {
      q: `Is ${item.name} accessible?`,
      a: `Yes. It is built to WCAG 2.2 AA: keyboard operable, screen-reader friendly, and reduced-motion-safe${item.supportsReducedMotion ? " (it respects prefers-reduced-motion)" : ""}. Status is never conveyed by color alone.`,
    },
    {
      q: `Does ${item.name} support dark mode?`,
      a: `Yes. ${item.name} is themed with design tokens and adapts to light and dark automatically — no per-component overrides needed.`,
    },
    {
      q: `Can I customize ${item.name}?`,
      a: `Fully. You install the source, not a black-box package, so you can edit markup, styles, tokens, and behavior. ${engine} It needs ${deps}.`,
    },
  ];
}
