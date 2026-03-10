import { NextResponse } from "next/server";
import { fetchAllContacts, fetchTags, fetchAllContactTags } from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PIPELINE_STAGES = ["became_lead", "profile_created", "onboarding_complete"];
const REJECTED_TAG = "founding_member_rejected";
const PEER_REVIEW_INVITED_TAG = "peer_review_invited";

const KNOWN_LEADS = new Set([
  "germanyjohnson@kw.com",
  "mikeusa03@aol.com",
  "wade@wadewright.com",
]);

export async function GET() {
  try {
    // Bulk fetch — replaces per-contact tag calls
    const [allContacts, tags, allContactTags] = await Promise.all([
      fetchAllContacts(),
      fetchTags(),
      fetchAllContactTags(),
    ]);
    const contacts = allContacts.filter((c) => !isTestUser(c.email));

    const tagIdToName = new Map(tags.map((t) => [t.id, t.tag.toLowerCase()]));

    // Build contact ID → tag names map
    const tagsByContact = new Map<string, string[]>();
    for (const ct of allContactTags) {
      const name = tagIdToName.get(ct.tag) ?? "";
      if (!name) continue;
      if (!tagsByContact.has(ct.contact)) tagsByContact.set(ct.contact, []);
      tagsByContact.get(ct.contact)!.push(name);
    }

    const stages: Record<string, Array<{ id: string; email: string; firstName: string; lastName: string; cdate?: string }>> = {};
    for (const stage of PIPELINE_STAGES) stages[stage] = [];

    for (const contact of contacts) {
      const tagNames = tagsByContact.get(contact.id) ?? [];

      if (tagNames.includes(REJECTED_TAG)) continue;

      for (const stage of PIPELINE_STAGES) {
        if (stage === "became_lead" && tagNames.includes(PEER_REVIEW_INVITED_TAG)) continue;
        if (tagNames.includes(stage)) {
          stages[stage].push({
            id: contact.id,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            cdate: contact.cdate,
          });
        }
      }
    }

    // Ensure known real leads appear in became_lead (unless they have peer_review_invited)
    const leadEmails = new Set(stages["became_lead"].map((c) => c.email.toLowerCase()));
    for (const contact of contacts) {
      const tagNames = tagsByContact.get(contact.id) ?? [];
      if (KNOWN_LEADS.has(contact.email.toLowerCase()) && !leadEmails.has(contact.email.toLowerCase()) && !tagNames.includes(PEER_REVIEW_INVITED_TAG)) {
        stages["became_lead"].push({
          id: contact.id,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          cdate: contact.cdate,
        });
      }
    }

    return NextResponse.json({ stages });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
