/// Route-level loading state for the dApp while it hydrates.
export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3 text-ink-dim">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-accent" />
        <span className="text-[0.85rem]">Loading the app…</span>
      </div>
    </div>
  );
}
