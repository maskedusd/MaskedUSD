"use client";

import { ArrowDown } from "lucide-react";
import PhoneFrame, { ActionButton, UsdcBadge, UsdmBadge } from "./PhoneFrame";

/**
 * Step 03 — Redeem to USDC. A static screen (matches the other two visually
 * now that they're live components). The redeem amount is shown shielded
 * ("Available ••••"); the "Redeem to USDC" button grows/depresses on
 * interaction but is inert.
 */
export default function RedeemMockup() {
  return (
    <PhoneFrame footer="No lockups · Redeem anytime">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
        Redeem
      </p>
      <h4 className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
        Redeem to USDC
      </h4>

      <div className="relative mt-4">
        {/* You redeem */}
        <div className="rounded-2xl border border-ink/[0.06] bg-white px-4 pb-3.5 pt-3 shadow-[0_18px_40px_-28px_rgba(27,20,56,0.45)]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            You redeem
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UsdmBadge />
              <div>
                <p className="font-display text-[16px] font-bold leading-tight text-ink">
                  $USDM
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
                  Available ••••
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-[23px] font-bold leading-none text-ink">
                500.00
              </p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
                $USDM
              </p>
            </div>
          </div>
        </div>

        {/* Direction arrow (decorative) */}
        <div className="relative z-10 -my-3.5 flex justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-accent-deep shadow-[0_10px_24px_-10px_rgba(107,79,207,0.6)]">
            <ArrowDown size={16} strokeWidth={2.4} />
          </span>
        </div>

        {/* You receive */}
        <div className="rounded-2xl border border-ink/[0.06] bg-[#f1ebfa] px-4 pb-3.5 pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            You receive
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UsdcBadge />
              <div>
                <p className="font-display text-[16px] font-bold leading-tight text-ink">
                  USDC
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
                  Native · Base
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-[23px] font-bold leading-none text-accent-deep">
                499.50
              </p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
                USDC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rate row */}
      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-ink-muted">
        <span>
          Rate <span className="text-ink">1 $USDM = 1 USDC</span>
        </span>
        <span>
          Redemption fee <span className="text-ink">0.10%</span>
        </span>
      </div>

      <div className="flex-1" />

      <ActionButton variant="dark">Redeem to USDC</ActionButton>
    </PhoneFrame>
  );
}
