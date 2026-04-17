import { NextResponse } from "next/server";
import {
  fetchTags,
  fetchAllContacts,
  fetchContactIdsByTagId,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const [tags, allContacts] = await Promise.all([fetchTags(), fetchAllContacts()]);

    const becameLead = tags.find((t) => t.tag.toLowerCase() === "became_lead");
    if (!becameLead) return NextResponse.json({ contacts: [] });

    // Get exact set of contact IDs that have the became_lead tag
    const leadIds = await fetchContactIdsByTagId(becameLead.id);

    // Filter list-3 contacts to only those with the tag
    const contacts = allContacts.filter(
      (c) => !isTestUser(c.email) && leadIds.has(c.id)
    );

    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const [contactTags, lists, automations] = await Promise.all([
            fetchContactTags(contact.id),
            fetchContactLists(contact.id),
            fetchContactAutomationsByContact(contact.id),
          ]);
          return { ...contact, tags: contactTags, lists, automations };
        } catch {
          return { ...contact, tags: [], lists: [], automations: [] };
        }
      })
    );

    return NextResponse.json({ contacts: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
