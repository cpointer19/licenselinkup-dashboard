const BASE = "https://graph.facebook.com/v21.0";

/**
 * Fetches total ad spend from the Meta Marketing API.
 * Uses a fixed since date (META_SPEND_SINCE) through today.
 * Returns spend in dollars as a number, or null if unavailable.
 */
export async function fetchMetaAdSpend(): Promise<number | null> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const accountId = process.env.META_AD_ACCOUNT_ID?.trim(); // e.g. "act_1384967262746943"
  const since = (process.env.META_SPEND_SINCE ?? "2026-03-08").trim();

  if (!token || !accountId) return null;

  // Use today's date as "until" so we always get the latest data
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const params = new URLSearchParams({
    fields: "spend",
    time_range: JSON.stringify({ since, until: today }),
    access_token: token,
  });

  const url = `${BASE}/${accountId}/insights?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("[meta] insights fetch failed:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  const spend = json?.data?.[0]?.spend;
  if (spend == null) return null;

  return parseFloat(spend);
}
