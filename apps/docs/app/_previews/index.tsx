"use client";

import * as React from "react";

import { BlurText } from "@/registry/text/blur-text";
import { KineticEmphasis } from "@/registry/text/kinetic-emphasis";
import { AiResponseStreamPreview } from "./ai-response-stream";
import { DeploymentPipelinePreview } from "./deployment-pipeline";
import { LivePresenceStackPreview } from "./live-presence-stack";
import { KpiNumberMorphPreview } from "./kpi-number-morph";
import { ToolCallActivityPreview } from "./tool-call-activity";
import { LiveLogStreamPreview } from "./live-log-stream";
import { ActivityStreamPreview } from "./activity-stream";
import { StreamingDataRowsPreview } from "./streaming-data-rows";
import { LuminousTopographyPreview } from "./luminous-topography";
import { SourceCitationRailPreview } from "./source-citation-rail";
import { ApiRequestInspectorPreview } from "./api-request-inspector";
import { ApprovalWorkflowPreview } from "./approval-workflow";
import { FilterResultTransitionPreview } from "./filter-result-transition";
import { SwipeActionRowPreview } from "./swipe-action-row";
import { AgentRunTimelinePreview } from "./agent-run-timeline";
import { EnvironmentSwitcherPreview } from "./environment-switcher";
import { CommentThreadPreview } from "./comment-thread";
import { DataRefreshStatePreview } from "./data-refresh-state";
import { MobileFilterSheetPreview } from "./mobile-filter-sheet";
import { AiAgentWorkspacePreview } from "./ai-agent-workspace";
import { DeploymentCommandCenterPreview } from "./deployment-command-center";
import { CollaborativeReviewWorkspacePreview } from "./collaborative-review-workspace";
import { LiveOperationsDashboardPreview } from "./live-operations-dashboard";
import { PromptComposerPreview } from "./prompt-composer";
import { WebhookEventStreamPreview } from "./webhook-event-stream";
import { MentionSuggestionsPreview } from "./mention-suggestions";
import { DataQualityStatusPreview } from "./data-quality-status";
import { KeyboardSafeFormPreview } from "./keyboard-safe-form";
import { FileUploadPipelinePreview } from "./file-upload-pipeline";
import { ProductVariantSelectorPreview } from "./product-variant-selector";
import { PasskeySetupFlowPreview } from "./passkey-setup-flow";
import { MessageDeliveryStatesPreview } from "./message-delivery-states";
import { KanbanCardMovementPreview } from "./kanban-card-movement";
import { MultiFileQueuePreview } from "./multi-file-queue";
import { CartItemTransitionPreview } from "./cart-item-transition";
import { TwoFactorSetupFlowPreview } from "./two-factor-setup-flow";
import { TypingAndPresencePreview } from "./typing-and-presence";
import { TaskDependencyMapPreview } from "./task-dependency-map";
import { ProcessingTimelinePreview } from "./processing-timeline";
import { CheckoutProgressPreview } from "./checkout-progress";
import { SessionSecurityCenterPreview } from "./session-security-center";
import { ThreadExpansionPreview } from "./thread-expansion";
import { ProjectTimelinePreview } from "./project-timeline";
import { RotatingText } from "@/registry/text/rotating-text";
import { SpotlightCard } from "@/registry/creative/spotlight-card";
import { AnimatedList, AnimatedListItem } from "@/registry/creative/animated-list";
import { AnimatedGrid } from "@/registry/backgrounds/animated-grid";
import { AnimatedArrow, AnimatedCopy } from "@/registry/icons/animated-icons";
import { AnimatedButton } from "@/registry/animated-shadcn/animated-button";
import {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
  AnimatedDialogClose,
  AnimatedDialogHeader,
  AnimatedDialogBody,
  AnimatedDialogFooter,
} from "@/registry/animated-shadcn/animated-dialog";
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
} from "@/registry/animated-shadcn/animated-tabs";
import {
  AnimatedAccordion,
  AnimatedAccordionItem,
  AnimatedAccordionTrigger,
  AnimatedAccordionContent,
} from "@/registry/animated-shadcn/animated-accordion";

/* shared bits ---------------------------------------------------------- */

const surface =
  "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]";

function Avatar({ i, name }: { i: number; name: string }) {
  const hue = [255, 190, 320, 150, 40][i % 5];
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${hue + 30} 70% 45%))` }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/* text ----------------------------------------------------------------- */

function BlurTextPreview() {
  return (
    <div className="w-full max-w-[640px] text-left">
      <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> New · v2 is here
      </span>
      <BlurText
        text="Design in motion, ship with confidence."
        as="h2"
        animateBy="words"
        delay={70}
        className="text-[clamp(1.9rem,4.4vw,3.1rem)] font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)]"
      />
      <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
        A production-grade text reveal for hero sections — accessible, reduced-motion-safe, and tuned for real
        marketing copy.
      </p>
    </div>
  );
}

function RotatingTextPreview() {
  return (
    <h2 className="text-center text-[clamp(1.7rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight text-[var(--color-fg)]">
      Build interfaces that feel
      <br className="hidden sm:block" />{" "}
      <span className="text-[var(--color-accent)]">
        <RotatingText words={["alive", "effortless", "accessible", "in motion"]} interval={2100} />
      </span>
    </h2>
  );
}

/* animated-shadcn ------------------------------------------------------ */

function AnimatedButtonPreview() {
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  return (
    <div className={`w-full max-w-[440px] ${surface} p-5`}>
      <p className="text-[13px] font-medium text-[var(--color-fg)]">Publish changes</p>
      <p className="mt-1 text-[13px] text-[var(--color-muted)]">Your edits are ready to go live.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <AnimatedButton
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1600);
          }}
        >
          {loading ? "Publishing" : "Publish"}
        </AnimatedButton>
        <AnimatedButton
          variant="outline"
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          <AnimatedCopy copied={copied} /> {copied ? "Copied" : "Copy link"}
        </AnimatedButton>
        <AnimatedButton variant="ghost" className="ml-auto">
          Cancel
        </AnimatedButton>
      </div>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[14px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)]";

function InviteDialog() {
  return (
    <AnimatedDialog animation="scale">
      <AnimatedDialogTrigger asChild>
        <AnimatedButton variant="outline">Invite</AnimatedButton>
      </AnimatedDialogTrigger>
      <AnimatedDialogContent>
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Invite to workspace</AnimatedDialogTitle>
          <AnimatedDialogDescription>They’ll get an email invite. Focus trap and Esc are preserved.</AnimatedDialogDescription>
        </AnimatedDialogHeader>
        <AnimatedDialogBody>
          <label className="mb-1 block text-[12px] font-medium text-[var(--color-muted)]">Email address</label>
          <input placeholder="teammate@company.com" className={fieldClass} />
          <label className="mb-1 mt-3 block text-[12px] font-medium text-[var(--color-muted)]">Role</label>
          <select className={fieldClass} defaultValue="Editor">
            <option>Owner</option>
            <option>Editor</option>
            <option>Viewer</option>
          </select>
        </AnimatedDialogBody>
        <AnimatedDialogFooter>
          <AnimatedDialogClose asChild>
            <AnimatedButton variant="ghost">Cancel</AnimatedButton>
          </AnimatedDialogClose>
          <AnimatedDialogClose asChild>
            <AnimatedButton>Send invite</AnimatedButton>
          </AnimatedDialogClose>
        </AnimatedDialogFooter>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}

function EditProfileDialog() {
  // Long form → demonstrates the pinned header/footer + scrolling body.
  return (
    <AnimatedDialog animation="scale">
      <AnimatedDialogTrigger asChild>
        <AnimatedButton variant="outline">Edit</AnimatedButton>
      </AnimatedDialogTrigger>
      <AnimatedDialogContent>
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Edit profile</AnimatedDialogTitle>
          <AnimatedDialogDescription>The header and actions stay pinned; only this body scrolls.</AnimatedDialogDescription>
        </AnimatedDialogHeader>
        <AnimatedDialogBody className="space-y-3">
          {[
            ["Display name", "Ada Lovelace"],
            ["Username", "@ada"],
            ["Email", "ada@analytical.engine"],
            ["Company", "Analytical Engines Ltd."],
            ["Location", "London, UK"],
            ["Website", "https://ada.dev"],
          ].map(([label, val]) => (
            <div key={label}>
              <label className="mb-1 block text-[12px] font-medium text-[var(--color-muted)]">{label}</label>
              <input defaultValue={val} className={fieldClass} />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--color-muted)]">Bio</label>
            <textarea rows={4} defaultValue="Mathematician. Wrote the first algorithm intended for a machine." className={fieldClass} />
          </div>
        </AnimatedDialogBody>
        <AnimatedDialogFooter>
          <AnimatedDialogClose asChild>
            <AnimatedButton variant="ghost">Cancel</AnimatedButton>
          </AnimatedDialogClose>
          <AnimatedDialogClose asChild>
            <AnimatedButton>Save changes</AnimatedButton>
          </AnimatedDialogClose>
        </AnimatedDialogFooter>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}

function DeleteDialog() {
  const [loading, setLoading] = React.useState(false);
  return (
    <AnimatedDialog animation="scale">
      <AnimatedDialogTrigger asChild>
        <AnimatedButton variant="ghost" className="text-[var(--color-error)] hover:bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)]">
          Delete
        </AnimatedButton>
      </AnimatedDialogTrigger>
      <AnimatedDialogContent className="sm:max-w-md">
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Delete workspace?</AnimatedDialogTitle>
          <AnimatedDialogDescription>
            This permanently removes the workspace and all its data. This cannot be undone.
          </AnimatedDialogDescription>
        </AnimatedDialogHeader>
        <AnimatedDialogFooter>
          <AnimatedDialogClose asChild>
            <AnimatedButton variant="ghost">Cancel</AnimatedButton>
          </AnimatedDialogClose>
          <AnimatedButton
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
            className="border-transparent bg-[var(--color-error)] text-white hover:bg-[color-mix(in_oklab,var(--color-error)_88%,black)]"
          >
            {loading ? "Deleting" : "Delete workspace"}
          </AnimatedButton>
        </AnimatedDialogFooter>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}

function AnimatedDialogPreview() {
  return (
    <div className={`w-full max-w-[440px] ${surface} p-5`}>
      <p className="text-[14px] font-semibold text-[var(--color-fg)]">Workspace settings</p>
      <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">Centered on desktop, an adaptive sheet on mobile.</p>
      <ul className="mt-4 divide-y divide-[var(--color-border)]">
        <li className="flex items-center gap-3 py-3">
          <Avatar i={0} name="Members" />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium text-[var(--color-fg)]">Members</span>
            <span className="block text-[12px] text-[var(--color-muted)]">3 people have access</span>
          </span>
          <span className="ml-auto">
            <InviteDialog />
          </span>
        </li>
        <li className="flex items-center gap-3 py-3">
          <Avatar i={2} name="Profile" />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium text-[var(--color-fg)]">Profile</span>
            <span className="block text-[12px] text-[var(--color-muted)]">Ada Lovelace</span>
          </span>
          <span className="ml-auto">
            <EditProfileDialog />
          </span>
        </li>
        <li className="flex items-center gap-3 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-error)_16%,transparent)] text-[var(--color-error)]" aria-hidden>
            !
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium text-[var(--color-fg)]">Danger zone</span>
            <span className="block text-[12px] text-[var(--color-muted)]">Delete this workspace</span>
          </span>
          <span className="ml-auto">
            <DeleteDialog />
          </span>
        </li>
      </ul>
    </div>
  );
}

function AnimatedTabsPreview() {
  const bars = [42, 68, 55, 80, 61, 90, 73];
  return (
    <div className={`w-full max-w-[440px] ${surface} p-5`}>
      <AnimatedTabs defaultValue="overview" className="w-full">
        <AnimatedTabsList>
          <AnimatedTabsTrigger value="overview">Overview</AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="analytics">Analytics</AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="reports">Reports</AnimatedTabsTrigger>
        </AnimatedTabsList>
        <AnimatedTabsContent value="overview" className="pt-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Revenue", "$48.2k"],
              ["Active", "1,204"],
              ["Churn", "1.8%"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                <p className="text-[11px] text-[var(--color-muted)]">{k}</p>
                <p className="mt-1 text-[16px] font-semibold text-[var(--color-fg)]">{v}</p>
              </div>
            ))}
          </div>
        </AnimatedTabsContent>
        <AnimatedTabsContent value="analytics" className="pt-5">
          <div className="flex h-[72px] items-end gap-1.5">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[var(--color-accent)]" style={{ height: `${h}%`, opacity: 0.35 + (h / 100) * 0.65 }} />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[var(--color-muted)]">Sessions, last 7 days</p>
        </AnimatedTabsContent>
        <AnimatedTabsContent value="reports" className="pt-5">
          <ul className="space-y-2 text-[13.5px] text-[var(--color-fg)]">
            {["Q3 summary.pdf", "Cohort retention.csv", "Funnel breakdown.xlsx"].map((f) => (
              <li key={f} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2">
                {f} <span className="text-[12px] text-[var(--color-muted)]">Download</span>
              </li>
            ))}
          </ul>
        </AnimatedTabsContent>
      </AnimatedTabs>
    </div>
  );
}

function AnimatedAccordionPreview() {
  const faqs = [
    { v: "a", q: "Is the source editable after install?", a: "Yes. The shadcn CLI copies TypeScript + Tailwind source directly into your project — edit it like your own code." },
    { v: "b", q: "Does it respect reduced motion?", a: "Every component honors prefers-reduced-motion: content opens instantly and stays fully reachable." },
    { v: "c", q: "Is accessibility preserved?", a: "Radix owns keyboard, focus, and semantics; the animation layer never removes them." },
  ];
  return (
    <div className={`w-full max-w-[480px] ${surface} px-5 py-2`}>
      <AnimatedAccordion type="single" collapsible defaultValue="a" className="w-full">
        {faqs.map((it) => (
          <AnimatedAccordionItem key={it.v} value={it.v} className="border-b border-[var(--color-border)] last:border-b-0">
            <AnimatedAccordionTrigger className="flex w-full items-center justify-between py-4 text-left text-[14.5px] font-medium text-[var(--color-fg)]">
              {it.q}
            </AnimatedAccordionTrigger>
            <AnimatedAccordionContent className="pb-4 pr-6 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
              {it.a}
            </AnimatedAccordionContent>
          </AnimatedAccordionItem>
        ))}
      </AnimatedAccordion>
    </div>
  );
}

/* creative ------------------------------------------------------------- */

function AnimatedListPreview() {
  const seed = [
    { id: 1, title: "Deployment succeeded", meta: "production · 2m ago", tone: "ok" },
    { id: 2, title: "Ada commented on “Auth flow”", meta: "design · 5m ago", tone: "info" },
    { id: 3, title: "Invoice #1042 paid", meta: "billing · 12m ago", tone: "ok" },
  ];
  const [items, setItems] = React.useState(seed);
  const next = React.useRef(4);
  const templates = [
    { title: "New sign-up from Berlin", meta: "growth · just now", tone: "info" },
    { title: "Backup completed", meta: "system · just now", tone: "ok" },
  ];
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-[13px] font-medium text-[var(--color-fg)]">Activity</p>
        <div className="ml-auto flex gap-2">
          <AnimatedButton variant="outline" onClick={() => setItems((xs) => [{ id: next.current++, ...templates[next.current % 2] }, ...xs])}>
            Add
          </AnimatedButton>
          <AnimatedButton variant="ghost" onClick={() => setItems((xs) => xs.slice(1))}>
            Dismiss
          </AnimatedButton>
        </div>
      </div>
      <AnimatedList className="space-y-2">
        {items.map((it) => (
          <AnimatedListItem key={it.id} className={`flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[var(--shadow-sm)]`}>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: it.tone === "ok" ? "var(--color-success)" : "var(--color-accent)" }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-[var(--color-fg)]">{it.title}</span>
              <span className="block text-[12px] text-[var(--color-muted)]">{it.meta}</span>
            </span>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  );
}

function SpotlightCardPreview() {
  return (
    <div className="grid w-full max-w-[520px] gap-4 sm:grid-cols-2">
      {[
        { t: "Edge deploys", d: "Ship to 300+ locations in seconds with zero config.", icon: "M13 2 3 14h7l-1 8 10-12h-7z" },
        { t: "Realtime sync", d: "Collaborative state that stays consistent everywhere.", icon: "M4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8M20 12a8 8 0 0 1-8 8 8 8 0 0 1-8-8" },
      ].map((f) => (
        <SpotlightCard key={f.t}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d={f.icon} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-fg)]">{f.t}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{f.d}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}

/* backgrounds ---------------------------------------------------------- */

function AnimatedGridPreview() {
  return (
    <div className="relative flex h-full min-h-[300px] w-full items-center justify-center overflow-hidden">
      <AnimatedGrid />
      <div className="relative z-10 max-w-[420px] px-6 text-center">
        <h3 className="text-[clamp(1.4rem,3.4vw,2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Ambient depth, zero JS loop
        </h3>
        <p className="mx-auto mt-2 max-w-[36ch] text-[13.5px] text-[var(--color-muted)]">
          A CSS-only layered grid that stays readable behind real content and stops under reduced motion.
        </p>
      </div>
    </div>
  );
}

/* icons ---------------------------------------------------------------- */

function AnimatedIconsPreview() {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <AnimatedButton className="w-full justify-center">
        Continue to checkout <AnimatedArrow triggerOn="hover" />
      </AnimatedButton>
      <div className={`flex w-full items-center justify-between gap-3 ${surface} px-3.5 py-2.5`}>
        <code className="truncate font-mono text-[12.5px] text-[var(--color-muted)]">sk_live_5f8a…c02</code>
        <AnimatedButton
          variant="outline"
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          <AnimatedCopy copied={copied} /> {copied ? "Copied" : "Copy key"}
        </AnimatedButton>
      </div>
    </div>
  );
}

/* kinetic-emphasis ------------------------------------------------------ */

/** Mirror the PreviewStage "Reduce motion" toggle (data-reduced on [data-stage])
 *  so the stage control genuinely drives the component's reducedMotion prop. */
function useStageReducedMotion(ref: React.RefObject<HTMLElement | null>) {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const stage = ref.current?.closest<HTMLElement>("[data-stage]");
    if (!stage) return;
    const read = () => setReduced(stage.hasAttribute("data-reduced"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(stage, { attributes: true, attributeFilter: ["data-reduced"] });
    return () => mo.disconnect();
  }, [ref]);
  return reduced;
}

const seg =
  "px-2.5 py-1 text-[12px] font-medium transition-colors data-[on=true]:bg-[var(--color-surface)] data-[on=true]:text-[var(--color-fg)] text-[var(--color-muted)] hover:text-[var(--color-fg)]";

function KineticEmphasisPreview() {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const stageReduced = useStageReducedMotion(wrapRef);
  const [speed, setSpeed] = React.useState<"slow" | "normal" | "fast">("normal");
  const [trail, setTrail] = React.useState(0.6);
  const [underline, setUnderline] = React.useState(true);
  const [nonce, setNonce] = React.useState(0);
  // trail applies on commit (pointer release / keyboard pause) with a replay,
  // matching the immediate feedback of the speed/underline controls
  const trailCommit = React.useRef<number | undefined>(undefined);
  const commitTrail = React.useCallback(() => {
    window.clearTimeout(trailCommit.current);
    trailCommit.current = window.setTimeout(() => setNonce((n) => n + 1), 250);
  }, []);

  return (
    <div ref={wrapRef} className="flex w-full max-w-[760px] flex-col gap-8 text-left">
      <div>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Signature text
        </span>
        <KineticEmphasis
          key={`h-${nonce}-${speed}-${underline}`}
          as="h2"
          play="in-view"
          speed={speed}
          trail={trail}
          emphasisStyle={underline ? "underline" : "none"}
          reducedMotion={stageReduced || undefined}
          className="text-balance text-[clamp(2rem,4.6vw,3.3rem)] font-semibold leading-[1.12] tracking-tight text-[var(--color-fg)]"
        >
          Motion that <em>understands emphasis</em>, not just easing.
        </KineticEmphasis>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
          Mark the phrase that matters with a real <code className="font-mono text-[13px]">&lt;em&gt;</code> — the
          sweep carries attention to it and leaves designed typography behind.
        </p>
      </div>

      <figure className="border-l-2 border-[var(--color-border)] pl-5">
        <KineticEmphasis
          key={`q-${nonce}-${speed}-${underline}`}
          as="p"
          play="in-view"
          speed="slow"
          trail={Math.min(trail, 0.4)}
          emphasisStyle={underline ? "underline" : "none"}
          reducedMotion={stageReduced || undefined}
          className="text-[17px] leading-relaxed text-[var(--color-fg)]"
        >
          Every reveal on this market treats words equally. <em>Reading has an order</em> — motion should know it.
        </KineticEmphasis>
        <figcaption className="mt-2 text-[12.5px] text-[var(--color-muted)]">Works at paragraph scale, too.</figcaption>
      </figure>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)]"
        >
          Replay
        </button>
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border)]" role="group" aria-label="Speed">
          {(["slow", "normal", "fast"] as const).map((s) => (
            <button key={s} type="button" data-on={speed === s} aria-pressed={speed === s} className={seg} onClick={() => setSpeed(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
          Trail
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={trail}
            onChange={(e) => setTrail(Number(e.target.value))}
            onPointerUp={commitTrail}
            onKeyUp={commitTrail}
            className="accent-[var(--color-accent)]"
            aria-label="Trail intensity"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--color-muted)] select-none">
          <input type="checkbox" checked={underline} onChange={(e) => setUnderline(e.target.checked)} className="accent-[var(--color-accent)]" />
          Persistent underline
        </label>
      </div>
    </div>
  );
}

/* map ------------------------------------------------------------------ */

export const previewMap: Record<string, React.ComponentType> = {
  "ai-response-stream": AiResponseStreamPreview,
  "deployment-pipeline": DeploymentPipelinePreview,
  "live-presence-stack": LivePresenceStackPreview,
  "kpi-number-morph": KpiNumberMorphPreview,
  "tool-call-activity": ToolCallActivityPreview,
  "live-log-stream": LiveLogStreamPreview,
  "activity-stream": ActivityStreamPreview,
  "streaming-data-rows": StreamingDataRowsPreview,
  "luminous-topography": LuminousTopographyPreview,
  "source-citation-rail": SourceCitationRailPreview,
  "api-request-inspector": ApiRequestInspectorPreview,
  "approval-workflow": ApprovalWorkflowPreview,
  "filter-result-transition": FilterResultTransitionPreview,
  "swipe-action-row": SwipeActionRowPreview,
  "agent-run-timeline": AgentRunTimelinePreview,
  "environment-switcher": EnvironmentSwitcherPreview,
  "comment-thread": CommentThreadPreview,
  "data-refresh-state": DataRefreshStatePreview,
  "mobile-filter-sheet": MobileFilterSheetPreview,
  "ai-agent-workspace": AiAgentWorkspacePreview,
  "deployment-command-center": DeploymentCommandCenterPreview,
  "collaborative-review-workspace": CollaborativeReviewWorkspacePreview,
  "live-operations-dashboard": LiveOperationsDashboardPreview,
  "prompt-composer": PromptComposerPreview,
  "webhook-event-stream": WebhookEventStreamPreview,
  "mention-suggestions": MentionSuggestionsPreview,
  "data-quality-status": DataQualityStatusPreview,
  "keyboard-safe-form": KeyboardSafeFormPreview,
  "file-upload-pipeline": FileUploadPipelinePreview,
  "product-variant-selector": ProductVariantSelectorPreview,
  "passkey-setup-flow": PasskeySetupFlowPreview,
  "message-delivery-states": MessageDeliveryStatesPreview,
  "kanban-card-movement": KanbanCardMovementPreview,
  "multi-file-queue": MultiFileQueuePreview,
  "cart-item-transition": CartItemTransitionPreview,
  "two-factor-setup-flow": TwoFactorSetupFlowPreview,
  "typing-and-presence": TypingAndPresencePreview,
  "task-dependency-map": TaskDependencyMapPreview,
  "processing-timeline": ProcessingTimelinePreview,
  "checkout-progress": CheckoutProgressPreview,
  "session-security-center": SessionSecurityCenterPreview,
  "thread-expansion": ThreadExpansionPreview,
  "project-timeline": ProjectTimelinePreview,
  "kinetic-emphasis": KineticEmphasisPreview,
  "blur-text": BlurTextPreview,
  "rotating-text": RotatingTextPreview,
  "animated-button": AnimatedButtonPreview,
  "animated-dialog": AnimatedDialogPreview,
  "animated-tabs": AnimatedTabsPreview,
  "animated-accordion": AnimatedAccordionPreview,
  "animated-list": AnimatedListPreview,
  "spotlight-card": SpotlightCardPreview,
  "animated-grid": AnimatedGridPreview,
  "animated-icons": AnimatedIconsPreview,
};

export function Preview({ id }: { id: string }) {
  const Cmp = previewMap[id];
  return Cmp ? <Cmp /> : <span className="text-sm text-[var(--color-muted)]">Preview unavailable</span>;
}
