import { AnimatedDialog } from "@scope/react";
import { Preview } from "../../_components/preview";

export const metadata = { title: "AnimatedDialog — @scope/ui" };

export default function Page() {
  return (
    <article className="docs-article">
      <h1>AnimatedDialog</h1>
      <p>
        An accessible modal built on Radix Dialog with a CSS-keyframe enter/exit (no animation
        engine). Focus trap + restore, <kbd>Esc</kbd> to close, labelled by its title. Reduced
        motion disables the animation.
      </p>
      <Preview
        code={`<AnimatedDialog
  trigger={<button className="scope-btn">Open dialog</button>}
  title="Delete project"
  description="This action cannot be undone."
>
  <button className="scope-btn">Confirm delete</button>
</AnimatedDialog>`}
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
      </Preview>
    </article>
  );
}
