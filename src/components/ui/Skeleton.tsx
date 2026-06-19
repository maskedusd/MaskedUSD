/// A shimmering placeholder for values that are still loading.
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-pulse rounded bg-ink/10 align-middle ${className}`}
    />
  );
}
