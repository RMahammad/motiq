import type { Meta, StoryObj } from "@storybook/react";
import { GradientText } from "./gradient-text";

const meta: Meta<typeof GradientText> = {
  title: "Motion/GradientText",
  component: GradientText,
  render: (args) => (
    <h1 style={{ fontSize: "3rem", margin: 0 }}>
      <GradientText {...args}>Ship it</GradientText>
    </h1>
  ),
};
export default meta;
type Story = StoryObj<typeof GradientText>;

export const Default: Story = {};
export const Custom: Story = { args: { from: "#6366f1", via: "#ec4899", to: "#f59e0b" } };
export const Animated: Story = { args: { from: "#6366f1", via: "#ec4899", to: "#f59e0b", animate: true } };
