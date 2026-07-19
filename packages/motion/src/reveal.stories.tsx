// CSF3 stories for Reveal. Runnable once Storybook 9 infra lands (apps/storybook, planned —
// docs/15-documentation-strategy.md). Excluded from tsc/vitest until then; kept as the
// canonical story set (default / on-mount / reduced-motion / directions / dark).
import type { Meta, StoryObj } from "@storybook/react";
import { Reveal } from "./reveal";

const Card = ({ label = "Reveal me" }: { label?: string }) => (
  <div
    style={{
      padding: 24,
      borderRadius: 12,
      background: "var(--card-bg, #f4f4f5)",
      color: "var(--card-fg, #18181b)",
      maxWidth: 320,
    }}
  >
    {label}
  </div>
);

const meta: Meta<typeof Reveal> = {
  title: "Motion/Reveal",
  component: Reveal,
  args: { direction: "up", distance: "md", duration: "normal", once: true },
  argTypes: {
    direction: { control: "inline-radio", options: ["up", "down", "left", "right", "none"] },
    distance: { control: "inline-radio", options: ["sm", "md", "lg"] },
    duration: { control: "inline-radio", options: ["instant", "fast", "normal", "slow"] },
  },
};
export default meta;

type Story = StoryObj<typeof Reveal>;

/** Scroll the card into view to trigger the reveal. */
export const InView: Story = {
  args: { trigger: "in-view" },
  render: (args) => (
    <div style={{ paddingTop: "120vh", paddingBottom: "40vh" }}>
      <Reveal {...args}>
        <Card />
      </Reveal>
    </div>
  ),
};

/** Animates on mount (no scroll needed). */
export const OnMount: Story = {
  args: { trigger: "mount" },
  render: (args) => (
    <Reveal {...args}>
      <Card label="Revealed on mount" />
    </Reveal>
  ),
};

/** Forced reduced motion: renders final state instantly, no transform. */
export const ReducedMotion: Story = {
  args: { trigger: "mount", reducedMotion: "force-reduce" },
  render: (args) => (
    <Reveal {...args}>
      <Card label="Reduced motion (no transform)" />
    </Reveal>
  ),
};

/** All directions on mount. */
export const Directions: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
      {(["up", "down", "left", "right"] as const).map((d) => (
        <Reveal key={d} trigger="mount" direction={d} distance="lg">
          <Card label={d} />
        </Reveal>
      ))}
    </div>
  ),
};

/** Dark theme via token overrides on a wrapper. */
export const Dark: Story = {
  args: { trigger: "mount" },
  render: (args) => (
    <div
      data-theme="dark"
      style={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ["--card-bg" as any]: "#27272a",
        ["--card-fg" as any]: "#fafafa",
        background: "#09090b",
        padding: 40,
      }}
    >
      <Reveal {...args}>
        <Card label="Dark theme" />
      </Reveal>
    </div>
  ),
};
