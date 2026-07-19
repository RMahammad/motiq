"use client";
import * as React from "react";
import * as RD from "@radix-ui/react-dialog";
import { cn } from "@scope/tokens/cn";

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Edge the sheet slides in from. */
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  closeLabel?: string;
}

/**
 * Sheet (a.k.a. Drawer) — an edge-anchored modal built on Radix Dialog with a CSS slide
 * animation per `side` (Radix waits for the exit animation). Same a11y guarantees as
 * AnimatedDialog: focus trap + restore, Escape, role="dialog" labelled by title. docs/12.
 */
export function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  side = "right",
  className,
  closeLabel = "Close",
}: SheetProps) {
  const describedBy = description ? undefined : { "aria-describedby": undefined };

  return (
    <RD.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <RD.Trigger asChild>{trigger}</RD.Trigger> : null}
      <RD.Portal>
        <RD.Overlay className="scope-sheet__overlay" data-slot="overlay" />
        <RD.Content
          className={cn("scope-sheet__content", className)}
          data-slot="content"
          data-side={side}
          {...describedBy}
        >
          <RD.Title className="scope-sheet__title" data-slot="title">
            {title}
          </RD.Title>
          {description ? (
            <RD.Description className="scope-sheet__desc" data-slot="description">
              {description}
            </RD.Description>
          ) : null}
          {children}
          <RD.Close aria-label={closeLabel} className="scope-sheet__close" data-slot="close">
            <span aria-hidden="true">×</span>
          </RD.Close>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
