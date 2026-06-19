"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, XCircle, X, ExternalLink } from "lucide-react";
import { explorerTxUrl } from "@/lib/explorer";

export type ToastStatus = "pending" | "success" | "error";

export interface Toast {
  id: string;
  status: ToastStatus;
  title: string;
  description?: string;
  hash?: `0x${string}`;
  chainId?: number;
}

interface ToastApi {
  show: (t: Omit<Toast, "id">) => string;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const autoDismiss = useCallback(
    (id: string, status: ToastStatus) => {
      if (timers.current[id]) clearTimeout(timers.current[id]);
      if (status !== "pending") {
        timers.current[id] = setTimeout(() => dismiss(id), 7000);
      }
    },
    [dismiss],
  );

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `t${seq.current++}`;
      setToasts((ts) => [...ts, { ...t, id }]);
      autoDismiss(id, t.status);
      return id;
    },
    [autoDismiss],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.status) autoDismiss(id, patch.status);
    },
    [autoDismiss],
  );

  return (
    <ToastContext.Provider value={{ show, update, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const url = explorerTxUrl(toast.chainId, toast.hash);
  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-ink/10 bg-surface p-3.5 shadow-lg shadow-accent/10">
      <span className="mt-0.5 shrink-0">
        {toast.status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
        {toast.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {toast.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.85rem] font-medium text-ink">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-[0.78rem] text-ink-muted">{toast.description}</p>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[0.76rem] font-medium text-accent-deep hover:underline"
          >
            View on explorer <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 text-ink-dim transition hover:bg-accent-soft hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
