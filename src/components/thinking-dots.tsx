export function ThinkingDots() {
  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="text-xs mr-1">Synapse is thinking</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  );
}