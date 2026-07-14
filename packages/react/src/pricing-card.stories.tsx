import type { Meta, StoryObj } from "@storybook/react";
import { PricingCard } from "./pricing-card";

const meta: Meta<typeof PricingCard> = {
  title: "Components/PricingCard",
  component: PricingCard,
  args: {
    planName: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing teams",
    features: ["Unlimited projects", "Priority support", "Analytics"],
    cta: { label: "Start free trial", href: "#" },
  },
};
export default meta;
type Story = StoryObj<typeof PricingCard>;

export const Default: Story = {};
export const Featured: Story = { args: { featured: true, badge: "Most popular" } };
export const Free: Story = {
  args: { planName: "Free", price: "$0", period: "", features: ["1 project"], featured: false, badge: undefined },
};
