import Link from "next/link";
import { AnimatedDialog } from "@scope/react";
import { ComponentStage } from "../../_components/component-stage";

export const metadata = { title: "AnimatedDialog — @scope/ui" };

const code = `import { AnimatedDialog } from "@scope/react";
import "@scope/react/styles.css";

<AnimatedDialog
  trigger={<button className="scope-btn">Open dialog</button>}
  title="Delete project"
  description="This action cannot be undone."
>
  <button className="scope-btn">Confirm delete</button>
</AnimatedDialog>`;

export default function Page() {
  return (
    <article className="wrap article">
      <div className="article__head">
        <p className="crumb">
          <Link href="/">@scope/ui</Link> / Overlay / AnimatedDialog
        </p>
        <h1>AnimatedDialog</h1>
        <p>
          An accessible modal built on Radix Dialog with a CSS‑keyframe enter/exit (no animation
          engine). Open it and press <kbd>Tab</kbd>/<kbd>Esc</kbd> — focus is trapped and restored.
          Flip reduced‑motion to see the animation disabled while the dialog stays fully functional.
        </p>
      </div>

      <ComponentStage
        code={code}
        facts={{
          package: "@scope/react",
          importPath: "@scope/react · @scope/react/dialog",
          boundary: '"use client"',
          bundle: "~1 kB brotli wrapper (Radix external, deduped)",
          deps: "peer: react, react-dom · @radix-ui/react-dialog · @scope/tokens",
          ssr: "closed → renders trigger only; content mounts on open",
          a11y: 'role="dialog" labelled by title · focus trap + restore · Esc closes · axe 0',
          reducedMotion: "keyframe enter/exit disabled; focus/scroll behavior unchanged",
          install: "pnpm add @scope/react @radix-ui/react-dialog",
          tests: "7 · focus/escape/restore + SSR + axe",
          browser: "evergreen; Radix waits for CSS exit animation",
          limitations: "single modal; use Sheet for edge drawers, Popover for non-modal panels",
        }}
      >
        <AnimatedDialog
          trigger={
            <button type="button" className="scope-btn">
              Open dialog
            </button>
          }
          title="Delete project"
          description="This action cannot be undone."
        >
          <button type="button" className="scope-btn">
            Confirm delete
          </button>
        </AnimatedDialog>
      </ComponentStage>
    </article>
  );
}
