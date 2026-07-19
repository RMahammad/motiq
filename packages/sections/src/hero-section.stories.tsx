import type { Meta, StoryObj } from "@storybook/react";
import { HeroSection } from "./hero-section";

const meta: Meta<typeof HeroSection> = {
  title: "Sections/HeroSection",
  component: HeroSection,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Now in beta",
    title: "Premium motion you can actually ship",
    subtitle: "Accessible, reduced-motion-aware, Server-Component-safe components.",
    actions: (
      <>
        <a href="#" className="scope-btn">Get started</a>
        <a href="#" className="scope-btn">Read the docs</a>
      </>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof HeroSection>;

export const Default: Story = {};
export const Centered: Story = { args: { align: "center" } };
export const NoAnimation: Story = { args: { animate: false } };
