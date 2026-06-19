"use client";

/// Error boundary for the dApp route — a graceful fallback if a client render throws (a bad RPC, a
/// wallet edge case). Reassures that nothing was sent, and offers a retry.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">Something went wrong</h2>
      <p className="max-w-sm text-[0.88rem] leading-relaxed text-ink-muted">
        The app hit an unexpected error. Your funds are safe — nothing was sent without your signature.
      </p>
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-deep"
        >
          Try again
        </button>
        <a href="/" className="text-[0.84rem] font-medium text-accent-deep hover:underline">
          Back to home
        </a>
      </div>
    </div>
  );
}
