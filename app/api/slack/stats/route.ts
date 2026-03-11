import { NextResponse, after } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { fetchAllContacts, fetchTags, fetchAllContactTags } from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PEER_REVIEW_INVITED_TAG = "peer_review_invited";
const REJECTED_TAG = "founding_member_rejected";

async function verifySlackSignature(req: Request, rawBody: string): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return true; // Allow if secret not yet set

  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  if (!timestamp || !signature) return false;

  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;

  const sigBase = `v0:${timestamp}:${rawBody}`;
  const hmac = createHmac("sha256", signingSecret).update(sigBase).digest("hex");
  const computed = `v0=${hmac}`;

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function fetchAndPostStats(responseUrl: string) {
  try {
    const [allContacts, tags, allContactTags] = await Promise.all([
      fetchAllContacts(),
      fetchTags(),
      fetchAllContactTags(),
    ]);

    const contacts = allContacts.filter((c) => !isTestUser(c.email));
    const tagIdToName = new Map(tags.map((t) => [t.id, t.tag.toLowerCase()]));

    const tagsByContact = new Map<string, string[]>();
    for (const ct of allContactTags) {
      const name = tagIdToName.get(ct.tag) ?? "";
      if (!name) continue;
      if (!tagsByContact.has(ct.contact)) tagsByContact.set(ct.contact, []);
      tagsByContact.get(ct.contact)!.push(name);
    }

    let leads = 0, profiles = 0, founding = 0;
    for (const contact of contacts) {
      const tagNames = tagsByContact.get(contact.id) ?? [];
      if (tagNames.includes(REJECTED_TAG)) continue;
      if (tagNames.includes("became_lead") && !tagNames.includes(PEER_REVIEW_INVITED_TAG)) leads++;
      if (tagNames.includes("profile_created")) profiles++;
      if (tagNames.includes("onboarding_complete")) founding++;
    }

    const now = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response_type: "in_channel",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "📊  LicenseLinkUp Pipeline", emoji: true },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*🔵  Leads*\n${leads}` },
              { type: "mrkdwn", text: `*🟣  Profiles Created*\n${profiles}` },
              { type: "mrkdwn", text: `*🟢  Founding Members*\n${founding}` },
            ],
          },
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: `_Updated: ${now} ET_` }],
          },
        ],
      }),
    });
  } catch (err) {
    await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response_type: "ephemeral",
        text: `❌ Error fetching stats: ${String(err)}`,
      }),
    });
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!(await verifySlackSignature(req, rawBody))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const responseUrl = params.get("response_url");

  if (!responseUrl) {
    return NextResponse.json({ error: "Missing response_url" }, { status: 400 });
  }

  // Fetch AC data in background AFTER responding to Slack immediately
  after(() => fetchAndPostStats(responseUrl));

  // Acknowledge within Slack's 3-second window
  return NextResponse.json({
    response_type: "ephemeral",
    text: "⏳ Fetching pipeline stats…",
  });
}
