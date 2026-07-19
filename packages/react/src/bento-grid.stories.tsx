import type { Meta, StoryObj } from "@storybook/react";
import { BentoGrid, BentoGridItem } from "./bento-grid";

const meta: Meta<typeof BentoGrid> = {
  title: "Components/BentoGrid",
  component: BentoGrid,
};
export default meta;
type Story = StoryObj<typeof BentoGrid>;

export const Default: Story = {
  render: () => (
    <BentoGrid columns={3} style={{ maxWidth: 720 }}>
      <BentoGridItem colSpan={2} rowSpan={2} title="Fast" description="Sub-second builds." />
      <BentoGridItem title="Accessible" description="WCAG 2.2 AA." />
      <BentoGridItem title="Typed" description="Strict TypeScript." />
      <BentoGridItem colSpan={2} title="Themeable" description="Token-driven, dark mode ready." />
    </BentoGrid>
  ),
};
