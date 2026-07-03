"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";

/**
 * SupportTicket — the ticket form on /support (anchored at #ticket). Posts to /api/support, which
 * relays to the team inbox via Resend. States: idle → sending → sent (shows the ticket id) /
 * error (shows the API's honest message — including the "inbox not connected yet" 503).
 *
 * The `company` field is a honeypot: visually hidden, ignored by humans, filled by bots.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];
const TOPICS = ["General", "App issue", "Mint / Redeem", "Shielded balance", "Partnerships"];

const FIELD =
  "w-full rounded-2xl border border-ink/10 bg-bg px-4 py-3 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-ink-dim focus:border-accent/50";

export default function SupportTicket() {
  const reduce = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    status === "idle" && name.trim().length > 0 && email.trim().length > 3 && message.trim().length > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, company }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't submit the ticket — please try again.");
        setStatus("idle");
        return;
      }
      setTicket(data.id ?? null);
      setStatus("sent");
    } catch {
      setError("Network hiccup — please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
        className="rounded-3xl border border-accent/20 bg-accent-soft/60 p-8 text-center sm:p-10"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <CheckCircle2 className="h-6 w-6 text-accent-deep" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-ink">
          Ticket submitted.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your reference is{" "}
          <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[0.82rem] text-accent-deep">
            {ticket ?? "—"}
          </span>
          . We&apos;ll reply to your email — keep the reference handy if you also ping us on
          Telegram.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="t-name" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
            Name
          </label>
          <input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="How should we address you?"
            className={FIELD}
            required
          />
        </div>
        <div>
          <label htmlFor="t-email" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
            Email
          </label>
          <input
            id="t-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            placeholder="Where we reply"
            className={FIELD}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="t-topic" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
          Topic
        </label>
        <select id="t-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={FIELD}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="t-message" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
          Message
        </label>
        <textarea
          id="t-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          rows={6}
          placeholder="What's going on? Include tx hashes or your wallet address if it's about a specific transaction — never your seed phrase or note secrets."
          className={`${FIELD} resize-y`}
          required
        />
      </div>

      {/* Honeypot — hidden from humans (and from assistive tech), filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="t-company">Company</label>
        <input
          id="t-company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[0.85rem] leading-relaxed text-ink-muted">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[0.95rem] font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-dim sm:w-auto sm:px-8"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send size={15} aria-hidden="true" />
            Submit ticket
          </>
        )}
      </button>
      <p className="text-[0.72rem] leading-relaxed text-ink-dim">
        We&apos;ll never ask for your seed phrase, note secrets, or a &quot;validation&quot; deposit —
        anyone who does is not us.
      </p>
    </form>
  );
}
