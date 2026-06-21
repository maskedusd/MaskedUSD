"use client";

import { useEffect, useState } from "react";
import { Unplug } from "lucide-react";

// Root-level "flash" toasts driven by a window event, so they survive route changes (e.g. disconnect
// on /app then redirect to the landing page). Fire with:
//   window.dispatchEvent(new CustomEvent("maskedusd:flash", { detail: "Wallet disconnected" }))

interface Flash {
  id: number;
  message: string;
}

export default function FlashToast() {
  const [flashes, setFlashes] = useState<Flash[]>([]);

  useEffect(() => {
    let seq = 0;
    function onFlash(e: Event) {
      const message = (e as CustomEvent<string>).detail ?? "Done";
      const id = ++seq;
      setFlashes((f) => [...f, { id, message }]);
      setTimeout(() => setFlashes((f) => f.filter((x) => x.id !== id)), 3500);
    }
    window.addEventListener("maskedusd:flash", onFlash);
    return () => window.removeEventListener("maskedusd:flash", onFlash);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {flashes.map((f) => (
        <FlashRow key={f.id} message={f.message} />
      ))}
    </div>
  );
}

function FlashRow({ message }: { message: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-surface px-4 py-3 shadow-lg shadow-accent/10 transition-all duration-300 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <Unplug className="h-4 w-4 text-red-500" />
      <span className="text-[0.85rem] font-medium text-ink">{message}</span>
    </div>
  );
}
