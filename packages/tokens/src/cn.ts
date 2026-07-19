import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class-name merge helper. Consumer classes always win on conflict.
 * Contract: docs/11-tailwind-strategy.md.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
