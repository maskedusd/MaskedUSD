import { NextResponse } from "next/server";

/**
 * POST /api/support — create a support ticket. Validates the payload, then relays it to the team
 * inbox via Resend's REST API (no SDK dependency; one fetch). The user's address goes in reply-to
 * so the team answers tickets directly from the inbox.
 *
 * Env:
 *  - RESEND_API_KEY  (required to actually send; without it we return 503 with an honest message)
 *  - SUPPORT_INBOX   (default contact@maskedusd.com — where tickets land)
 *  - SUPPORT_FROM    (default "MaskedUSD Support <support@maskedusd.com>" — must be on a domain
 *                     verified in Resend)
 *
 * Abuse guards (proportionate for a support form): a honeypot field bots fill and humans never
 * see (pretend-success so bots don't adapt), strict length caps, and a shape check on the email.
 */

const TOPICS = ["General", "App issue", "Mint / Redeem", "Shielded balance", "Partnerships"] as const;

const MAX = { name: 100, email: 200, message: 4000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function ticketId(): string {
  // MUSD-XXXXXX — short, human-quotable, unambiguous alphabet (no 0/O/1/I).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let id = "";
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return `MUSD-${id}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" && (TOPICS as readonly string[]).includes(body.topic) ? body.topic : "General";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const honeypot = typeof body.company === "string" ? body.company : "";

  // Bots fill every field — humans never see this one. Pretend success so they don't adapt.
  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true, id: ticketId() });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return NextResponse.json({ error: "One of the fields is too long." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That email address doesn't look valid." }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "The ticket inbox isn't connected yet — please reach us on Telegram (t.me/maskedusd) for now." },
      { status: 503 },
    );
  }

  const id = ticketId();
  const to = process.env.SUPPORT_INBOX ?? "contact@maskedusd.com";
  const from = process.env.SUPPORT_FROM ?? "MaskedUSD Support <support@maskedusd.com>";

  const text = [
    `Ticket   ${id}`,
    `From     ${name} <${email}>`,
    `Topic    ${topic}`,
    ``,
    message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: [email],
      subject: `[${id}] ${topic} — ${name}`,
      text,
    }),
  });

  if (!res.ok) {
    // Log the provider detail server-side; never leak it to the client.
    console.error("resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json(
      { error: "Couldn't submit the ticket right now — please try again, or reach us on Telegram." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
