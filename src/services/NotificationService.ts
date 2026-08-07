import { serverEnv as env } from "@/lib/env.server";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Posts a message to a Discord channel via the bot token.
 * Fire-and-forget — failures are logged but not re-thrown.
 */
export async function postDiscordAlert(
  channelId: string,
  content: string
): Promise<void> {
  if (!env.DISCORD_BOT_TOKEN) return;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[NotificationService] Discord POST failed (${res.status}): ${body}`
      );
    }
  } catch (err) {
    console.error("[NotificationService] Discord POST error:", err);
  }
}

// ─── Email ─────────────────────────────────────────────────────────────────────

export interface DigestEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends a transactional digest email via Resend.
 * No-op when RESEND_API_KEY is not configured.
 * Throws on Resend API errors — callers should handle per-user.
 */
export async function sendDigestEmail(params: DigestEmailParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("[NotificationService] RESEND_API_KEY not set — skipping digest email");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
