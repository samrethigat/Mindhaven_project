import { HeartPulse } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)]">
        <HeartPulse className="size-5" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">MindHaven</span>
      )}
    </span>
  );
}