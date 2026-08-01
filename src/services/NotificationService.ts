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
