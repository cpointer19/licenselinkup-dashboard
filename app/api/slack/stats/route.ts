import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { fetchAllContacts, fetchTags, fetchAllContactTags } from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PEER_REVIEW_INVITED_TAG = "peer_review_invited";
const REJECTED_TAG = "founding_member_rejected";

// Verify Slack's HMAC-SHA256 request signature to reject forged requests
async function verifySlackSignature(req: Request, rawBody: string): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn("SLACK_SIGNING_SECRET not set — skipping verification");
    return true; // Allow during initial setup; set the secret before going live
  }

  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes (replay attack prevention)
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

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!(await verifySlackSignature(req, rawBody))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

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

    let leads = 0;
    let profiles = 0;
    let founding = 0;

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

    return NextResponse.json({
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
          elements: [
            { type: "mrkdwn", text: `_Last updated: ${now} ET_` },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("Slack stats error:", err);
    return NextResponse.json({
      response_type: "ephemeral",
      text: `❌ Error fetching stats: ${String(err)}`,
    });
  }
}
