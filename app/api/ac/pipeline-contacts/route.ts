import { NextResponse } from "next/server";
import { fetchAllContacts, fetchTags, fetchContactTags } from "@/lib/activecampaign";

export const revalidate = 60;

const PIPELINE_STAGES = ["became_lead", "profile_created", "onboarding_complete"];

export async function GET() {
  try {
    const [contacts, tags] = await Promise.all([fetchAllContacts(), fetchTags()]);

    // Build tag ID → tag name map
    const tagIdToName = new Map(tags.map((t) => [t.id, t.tag.toLowerCase()]));
    // Build pipeline tag name → tag ID map
    const pipelineTagIds = new Map<string, string>();
    for (const t of tags) {
      if (PIPELINE_STAGES.includes(t.tag.toLowerCase())) {
        pipelineTagIds.set(t.tag.toLowerCase(), t.id);
      }
    }

    // For each contact, fetch their tags and categorize into pipeline stages
    const contactTagResults = await Promise.all(
      contacts.map(async (c) => {
        try {
          const contactTags = await fetchContactTags(c.id);
          const tagNames = contactTags.map((ct) => tagIdToName.get(ct.tag) ?? "").filter(Boolean);
          return { contact: c, tagNames };
        } catch {
          return { contact: c, tagNames: [] as string[] };
        }
      })
    );

    // Group contacts by highest pipeline stage they've reached
    const stages: Record<string, Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      cdate?: string;
    }>> = {};

    for (const stage of PIPELINE_STAGES) {
      stages[stage] = [];
    }

    for (const { contact, tagNames } of contactTagResults) {
      // Find the highest stage this contact is in
      for (const stage of PIPELINE_STAGES) {
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

    return NextResponse.json({ stages });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
