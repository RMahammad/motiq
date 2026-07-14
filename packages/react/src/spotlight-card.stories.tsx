import type { Meta, StoryObj } from "@storybook/react";
import { SpotlightCard } from "./spotlight-card";

const meta: Meta<typeof SpotlightCard> = {
  title: "Components/SpotlightCard",
  component: SpotlightCard,
  args: { radius: 240 },
  render: (args) => (
    <SpotlightCard {...args} style={{ maxWidth: 360 }}>
      <h3 style={{ margin: 0 }}>Hover me</h3>
      <p style={{ marginTop: 8 }}>A spotlight follows your pointer (hidden on touch).</p>
    </SpotlightCard>
  ),
};
export default meta;
type Story = StoryObj<typeof SpotlightCard>;

export const Default: Story = {};
export const LargeRadius: Story = { args: { radius: 380 } };
