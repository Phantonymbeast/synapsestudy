import { cn } from "@/lib/utils";

export function SynapseLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow" />
      <svg viewBox="0 0 32 32" width={size * 0.65} height={size * 0.65} className="relative text-white">
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="10" r="2.2" fill="currentColor" />
          <circle cx="24" cy="10" r="2.2" fill="currentColor" opacity="0.85" />
          <circle cx="8" cy="22" r="2.2" fill="currentColor" opacity="0.85" />
          <circle cx="24" cy="22" r="2.2" fill="currentColor" />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
          <path d="M10 10 L14 15 M22 10 L18 15 M10 22 L14 17 M22 22 L18 17" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

export function SynapseWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SynapseLogo size={32} />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight">Synapse</span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Study AI</span>
      </div>
    </div>
  );
}