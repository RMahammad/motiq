"use client";
import * as React from "react";
import * as RD from "@radix-ui/react-dialog";
import { cn } from "@scope/tokens/cn";

export interface AnimatedDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog (rendered via Radix Trigger asChild). */
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Accessible name for the close button. */
  closeLabel?: string;
}

/**
 * AnimatedDialog — accessible modal built on Radix Dialog with CSS keyframe enter/exit
 * (Radix waits for the exit animation before unmounting). Focus trap + restore, Escape to
 * close, aria-modal, labelled by title — all from Radix (docs/12, ADR-0011). Reduced motion
 * removes the animation. No animation engine dependency (docs/06 CSS-first escalation).
 */
export function AnimatedDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
  closeLabel = "Close",
}: AnimatedDialogProps) {
  // Opt out of Radix's description warning only when we render no description.
  const describedBy = description ? undefined : { "aria-describedby": undefined };

  return (
    <RD.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <RD.Trigger asChild>{trigger}</RD.Trigger> : null}
      <RD.Portal>
        <RD.Overlay className="scope-dialog__overlay" data-slot="overlay" />
        <RD.Content
          className={cn("scope-dialog__content", className)}
          data-slot="content"
          {...describedBy}
        >
          <RD.Title className="scope-dialog__title" data-slot="title">
            {title}
          </RD.Title>
          {description ? (
            <RD.Description className="scope-dialog__desc" data-slot="description">
              {description}
            </RD.Description>
          ) : null}
          {children}
          <RD.Close aria-label={closeLabel} className="scope-dialog__close" data-slot="close">
            <span aria-hidden="true">×</span>
          </RD.Close>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
