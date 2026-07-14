import Link from "next/link";
import { MotionScene, MotionStep } from "@scope/motion";
import { ProductIntroduction } from "@scope/recipes";
import { MotionLab } from "./_components/motion-lab";
import { CATALOG } from "./components/_registry";

// Server Component. The interactive Motion Laboratory is the only client island (ADR-0016).
// ProductIntroduction is a client leaf composed directly (server-safe shell).

// Only the first recipe is built today; the rest are honestly labelled as planned.
const PLANNED_RECIPES = [
  { name: "Pricing selection", used: "PricingCard · StateTransition", intents: "confirm · focus" },
  { name: "Search → results", used: "Stagger · Presence", intents: "transition · reorder" },
  { name: "File-upload lifecycle", used: "MotionSequence", intents: "progress · confirm · notify" },
];

export default function Home() {
  return (
    <>
      {/* ---------- Hero: live motion stage above the fold ---------- */}
      <section className="wrap hero">
        <div className="hero__copy">
          <p className="eyebrow">Semantic motion system · React &amp; Next.js</p>
          <h1 className="display">
            Author motion by <em style={{ color: "var(--lab-signal)", fontStyle: "normal" }}>intent</em>,
            not keyframes.
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Describe what a section should <em>do</em> — introduce, emphasize, confirm — and the
            system compiles safe, consistent, choreographed motion. Accessibility, reduced motion,
            mobile and interruption are built in.
          </p>
          <div className="hero__actions">
            <Link href="/components/pricing-card" className="btn btn--signal">
              Get started
            </Link>
            <a href="#lab" className="btn">
              Try the Motion Lab ↓
            </a>
          </div>
          <div className="hero__meta">
            <span>
              <b>22</b> components
            </span>
            <span>
              <b>123</b> tests
            </span>
            <span>
              <b>RSC</b>-safe
            </span>
            <span>
              <b>WCAG</b> 2.2 AA
            </span>
          </div>
        </div>
        <div id="lab">
          <MotionLab />
        </div>
      </section>

      <hr className="rule" />

      {/* ---------- Choreography: the moat, shown ---------- */}
      <section className="wrap pad" id="choreography">
        <p className="section-tag">01 · Choreography, not isolated effects</p>
        <h2 className="display">A section enters as one scene.</h2>
        <p className="lead" style={{ marginTop: 14, marginBottom: 32 }}>
          Instead of every element inventing its own timing, a <code className="mono">MotionScene</code>{" "}
          coordinates heading → copy → preview → action in sequence — typed by role and intent.
        </p>
        <div className="split">
          <div className="code" style={{ borderRadius: "var(--lab-radius)", border: "1px solid var(--lab-hairline)" }}>
            <pre>
              <code>{`<MotionScene preset="product-introduction">
  <MotionStep role="heading">
    <Heading />
  </MotionStep>
  <MotionStep role="supporting-content" intent="deemphasize">
    <Description />
  </MotionStep>
  <MotionStep role="product-preview" intent="introduce">
    <ProductPreview />
  </MotionStep>
  <MotionStep role="primary-action" intent="emphasize">
    <CTA />
  </MotionStep>
</MotionScene>`}</code>
            </pre>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", minHeight: 280 }}>
            <MotionScene trigger="in-view" intensity="expressive" gap="lg" className="demo-col" style={{ margin: "0 auto" }}>
              <MotionStep role="heading">
                <h3 className="demo-h" style={{ color: "var(--lab-ink)" }}>
                  Introducing Scenes
                </h3>
              </MotionStep>
              <MotionStep role="supporting-content" intent="deemphasize">
                <p className="demo-p" style={{ color: "var(--lab-muted)" }}>
                  Heading, copy, preview and action arrive as a coordinated sequence.
                </p>
              </MotionStep>
              <MotionStep role="product-preview" intent="introduce">
                <div className="card" style={{ background: "var(--lab-panel-2)" }}>
                  <span className="stat">preview</span>
                  <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
                    Any real component can be a step.
                  </p>
                </div>
              </MotionStep>
              <MotionStep role="primary-action" intent="emphasize">
                <button type="button" className="btn btn--signal btn--sm">
                  Primary action
                </button>
              </MotionStep>
            </MotionScene>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* ---------- Production proof: asymmetric editorial, not 3 equal cards ---------- */}
      <section className="wrap pad">
        <p className="section-tag">02 · Verifiable production quality</p>
        <div className="proof">
          <div className="card card--wide proof__lead">
            <h3>The boring 80%, handled for you.</h3>
            <p style={{ marginBottom: 14 }}>
              Free effects hand you a fade and walk away. Every preset here ships the parts teams
              actually re-implement on every component — and proves them, live, on each page.
            </p>
            <p className="stat">reduced-motion · keyboard-interrupt · SSR-safe · tree-shaken · typed · tested</p>
          </div>
          <div className="card">
            <h3>Reduced motion, built in</h3>
            <p>Toggle it in the Lab above — steps render at final state, no transform, fully usable.</p>
          </div>
          <div className="card">
            <h3>RSC-safe packaging</h3>
            <p>
              <code className="mono">"use client"</code> preserved through the build; sections are
              server-safe and compose client leaves.
            </p>
          </div>
          <div className="card">
            <h3>Tiny &amp; tree-shaken</h3>
            <p>Per-component size budgets in CI. The choreography primitive is ~1&nbsp;kB brotli.</p>
          </div>
          <div className="card">
            <h3>Tested motion</h3>
            <p>Fake-timer + in-view + SSR + axe tests across 123 cases — motion you can assert on.</p>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* ---------- Recipes: workflows, not effects — led by a live one ---------- */}
      <section className="wrap pad" id="recipes">
        <p className="section-tag">03 · Motion recipes — complete workflows</p>
        <h2 className="display" style={{ marginBottom: 14 }}>
          Sell outcomes, not parts.
        </h2>
        <p className="lead" style={{ marginBottom: 28 }}>
          A recipe is a whole workflow you install and fill with your own content. The first one is
          live below — a choreographed product hero from{" "}
          <code className="mono">@scope/recipes</code>, 635&nbsp;B, one coordinated scene.
        </p>
        <div
          className="card"
          style={{ padding: "clamp(24px, 4vw, 48px)", borderRadius: "var(--lab-radius)" }}
        >
          <ProductIntroduction
            headingLevel={2}
            intensity="expressive"
            eyebrow="Recipe · ProductIntroduction"
            title="Author motion by intent"
            subtitle="Eyebrow, heading, copy, preview and actions arrive as one coordinated sequence — you supply the content through slots."
            media={
              <div className="card" style={{ background: "var(--lab-panel-2)", minHeight: 150 }}>
                <span className="stat">product preview</span>
                <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
                  Any real component drops in here.
                </p>
              </div>
            }
            primaryAction={
              <Link href="/components/product-introduction" className="btn btn--signal btn--sm">
                Open the live recipe →
              </Link>
            }
            secondaryAction={
              <a href="#catalog" className="btn btn--sm">
                Browse components
              </a>
            }
          />
        </div>
        <p className="section-tag" style={{ margin: "32px 0 12px" }}>
          More recipes — <b>planned</b>
        </p>
        {PLANNED_RECIPES.map((r) => (
          <div className="strip" key={r.name} data-planned>
            <span style={{ fontFamily: "var(--lab-display)", fontWeight: 600 }}>
              {r.name} <span className="muted" style={{ fontWeight: 400 }}>· planned</span>
            </span>
            <span className="strip__meta">
              <span>
                uses · <b>{r.used}</b>
              </span>
              <span>
                intents · <b>{r.intents}</b>
              </span>
            </span>
          </div>
        ))}
      </section>

      <hr className="rule" />

      {/* ---------- Live catalog ---------- */}
      <section className="wrap pad" id="catalog">
        <p className="section-tag">04 · Component catalog · {CATALOG.length} live pages</p>
        <h2 className="display" style={{ marginBottom: 28 }}>
          Real components, real pages.
        </h2>
        <div className="catalog">
          {CATALOG.map((c) => (
            <Link key={c.slug} href={`/components/${c.slug}`} className="tile">
              <span className="tile__cat">{c.category}</span>
              <span className="tile__name">{c.name}</span>
              <span className="tile__desc">{c.tagline}</span>
              <span className="tile__go">Open live →</span>
            </Link>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* ---------- Pricing (proposed — no invented numbers) ---------- */}
      <section className="wrap pad" id="pricing">
        <p className="section-tag">05 · Offering · proposed</p>
        <h2 className="display" style={{ marginBottom: 8 }}>
          Free foundation, paid system.
        </h2>
        <p className="lead" style={{ marginBottom: 28 }}>
          Pricing is <b>proposed</b> and not yet final — no numbers are shown until approved.
        </p>
        <div className="tiers">
          <div className="tier">
            <span className="tier__name">Free</span>
            <span className="tier__price">$0 · open</span>
            <ul>
              <li>MotionProvider · Reveal · Stagger · InView</li>
              <li>Core semantic presets</li>
              <li>Reduced-motion utilities</li>
              <li>Basic testing helpers</li>
            </ul>
          </div>
          <div className="tier" data-featured>
            <span className="badge">Proposed</span>
            <span className="tier__name">Pro</span>
            <span className="tier__price">Pricing coming soon</span>
            <ul>
              <li>MotionScene · MotionStep · StateTransition</li>
              <li>Advanced choreography presets</li>
              <li>Signature workflow recipes</li>
              <li>Interactive production catalog</li>
            </ul>
          </div>
          <div className="tier">
            <span className="tier__name">Team / Agency</span>
            <span className="tier__price">Pricing coming soon</span>
            <ul>
              <li>Everything in Pro</li>
              <li>Source-registry access</li>
              <li>Company-wide motion theme</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* ---------- Final CTA ---------- */}
      <section className="wrap final">
        <p className="eyebrow" style={{ justifyContent: "center" }}>
          Start free
        </p>
        <h2 className="display">Motion your team can actually ship.</h2>
        <p className="lead" style={{ margin: "16px auto 0" }}>
          Accessible, reduced-motion-safe, RSC-safe, typed, tested — with a source-registry escape
          hatch when you need to customize.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/components/pricing-card" className="btn btn--signal">
            Browse components
          </Link>
          <a href="#lab" className="btn">
            Replay the Motion Lab
          </a>
        </div>
      </section>
    </>
  );
}
