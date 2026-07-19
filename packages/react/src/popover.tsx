"use client";
import * as React from "react";
import * as RP from "@radix-ui/react-popover";
import { cn } from "@scope/tokens/cn";

export interface PopoverProps {
  /** The trigger element (rendered via Radix Trigger asChild). */
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Show a close (✕) button; label is its accessible name. */
  closeLabel?: string;
}

/**
 * Popover — click-triggered floating panel on Radix Popover. Manages focus (moves in on
 * open, restores on close), Escape to close, outside-click dismiss. CSS-animated via
 * data-state; reduced motion disables it. docs/12.
 */
export function Popover({
  trigger,
  children,
  side = "bottom",
  align = "center",
  open,
  defaultOpen,
  onOpenChange,
  className,
  closeLabel,
}: PopoverProps) {
  return (
    <RP.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RP.Trigger asChild>{trigger}</RP.Trigger>
      <RP.Portal>
        <RP.Content
          side={side}
          align={align}
          sideOffset={8}
          className={cn("scope-popover", className)}
          data-slot="popover"
        >
          {children}
          {closeLabel ? (
            <RP.Close aria-label={closeLabel} className="scope-popover__close" data-slot="close">
              <span aria-hidden="true">×</span>
            </RP.Close>
          ) : null}
          <RP.Arrow className="scope-popover__arrow" />
        </RP.Content>
      </RP.Portal>
    </RP.Root>
  );
}
