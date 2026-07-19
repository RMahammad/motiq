"use client";
import * as React from "react";
import * as RT from "@radix-ui/react-tooltip";
import { cn } from "@scope/tokens/cn";

export interface TooltipProps {
  /** Tooltip text/content. */
  content: React.ReactNode;
  /** The trigger element (rendered via Radix Trigger asChild). */
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Hover open delay (ms). */
  delayDuration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Tooltip — accessible hover/focus tooltip on Radix Tooltip (role="tooltip"), CSS-animated
 * via data-state. Opens on hover and keyboard focus; Escape/blur closes. Self-contained
 * Provider (apps may also add a single root <TooltipProvider> for shared delay). docs/12.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: TooltipProps) {
  return (
    <RT.Provider delayDuration={delayDuration}>
      <RT.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <RT.Trigger asChild>{children}</RT.Trigger>
        <RT.Portal>
          <RT.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn("scope-tooltip", className)}
            data-slot="tooltip"
          >
            {content}
            <RT.Arrow className="scope-tooltip__arrow" />
          </RT.Content>
        </RT.Portal>
      </RT.Root>
    </RT.Provider>
  );
}
