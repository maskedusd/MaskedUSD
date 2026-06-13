"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import MaskIcon from "../MaskIcon";
import PhoneFrame, { ActionButton, ShieldGlyph } from "./PhoneFrame";

/**
 * Step 02 — Shielded balance. Interactive: the eye toggles the balance between
 * masked (dots) and a (fake) revealed amount, and simultaneously un-masks the
 * recent-activity counterparties and amounts (also fake). The "Send privately"
 * button grows/depresses on interaction but is inert.
 *
 * Honesty: the revealed numbers/names are obviously illustrative demo data.
 */

/** Crossfades between a masked node and a revealed node. */
function Reveal({
  revealed,
  hidden,
  shown,
}: {
  revealed: boolean;
  hidden: ReactNode;
  shown: ReactNode;
}) {
  return (
    <span className="grid">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={revealed ? "shown" : "hidden"}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2 }}
          className="[grid-area:1/1]"
        >
          {revealed ? shown : hidden}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function ActivityRow({
  dir,
  label,
  prep,
  party,
  amount,
  revealed,
}: {
  dir: "up" | "down";
  label: string;
  prep: string;
  party: string;
  amount: string;
  revealed: boolean;
}) {
  const Arrow = dir === "up" ? ArrowUp : ArrowDown;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-ink/[0.05] bg-white px-3.5 py-2.5 shadow-[0_12px_26px_-22px_rgba(27,20,56,0.4)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
          <Arrow size={15} strokeWidth={2.2} />
        </span>
        <div>
          <p className="font-display text-[14px] font-bold leading-tight text-ink">
            {label}
          </p>
          <p className="font-mono text-[10px] text-ink-dim">
            {prep}{" "}
            <Reveal
              revealed={revealed}
              hidden={<span className="tracking-[0.1em]">••••</span>}
              shown={<span className="text-ink-muted">{party}</span>}
            />
          </p>
        </div>
      </div>
      <p className="font-mono text-[12px] text-ink">
        <Reveal
          revealed={revealed}
          hidden={<span className="tracking-[0.1em]">••••</span>}
          shown={<span>{amount}</span>}
        />{" "}
        <span className="text-ink-dim">$USDM</span>
      </p>
    </div>
  );
}

export default function ShieldMockup() {
  const reduce = useReducedMotion() ?? false;
  const [revealed, setRevealed] = useState(false);

  return (
    <PhoneFrame footer="Private, not hidden from math">
      {/* Shielded balance header (centered) */}
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-accent-deep">
        Shielded balance
      </p>
      <div className="mt-3 flex justify-center">
        <span className="flex h-13 w-13 items-center justify-center rounded-full border border-accent/15 bg-white shadow-[0_12px_30px_-16px_rgba(107,79,207,0.6)]">
          <ShieldGlyph size={24} />
        </span>
      </div>

      {/* Balance card */}
      <div className="mt-3 rounded-[20px] border border-ink/[0.05] bg-white px-5 py-4 text-center shadow-[0_20px_44px_-30px_rgba(27,20,56,0.45)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
          $USDM · Private
        </p>
        <div className="mt-2.5 flex items-center justify-center gap-3">
          <Reveal
            revealed={revealed}
            hidden={
              <span className="flex items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="h-2.5 w-2.5 rounded-full bg-ink" />
                ))}
              </span>
            }
            shown={
              <span className="font-display text-[27px] font-bold leading-none text-ink">
                12,847.50
              </span>
            }
          />
          <motion.button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            whileTap={reduce ? undefined : { scale: 0.86 }}
            aria-label={revealed ? "Hide balance" : "Show balance"}
            className="text-ink-dim transition-colors hover:text-ink"
          >
            {revealed ? (
              <Eye size={20} strokeWidth={1.9} />
            ) : (
              <EyeOff size={20} strokeWidth={1.9} />
            )}
          </motion.button>
        </div>
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
          {revealed ? "Visible to you only" : "Hidden by dZK Proof"}
        </p>
      </div>

      {/* Trust bullets */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-center gap-2.5 font-mono text-[12px] text-ink">
          <span className="status-dot" aria-hidden="true" />
          Private by default
        </div>
        <div className="flex items-center gap-2.5 font-mono text-[12px] text-ink">
          <MaskIcon width={17} />
          Shielded by dZK Proof
        </div>
      </div>

      {/* Recent activity */}
      <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        Recent activity
      </p>
      <div className="mt-2 space-y-2">
        <ActivityRow
          dir="up"
          label="Sent"
          prep="To"
          party="alex.base.eth"
          amount="−250.00"
          revealed={revealed}
        />
        <ActivityRow
          dir="down"
          label="Received"
          prep="From"
          party="treasury.base.eth"
          amount="+1,000.00"
          revealed={revealed}
        />
      </div>

      <div className="flex-1" />

      <ActionButton variant="light">
        Send privately
        <ArrowUpRight size={17} strokeWidth={2.2} />
      </ActionButton>
    </PhoneFrame>
  );
}
