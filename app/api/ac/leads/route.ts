import { NextResponse } from "next/server";
import {
  fetchTags,
  fetchContactsByTagId,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const tags = await fetchTags();
    const becameLead = tags.find((t) => t.tag.toLowerCase() === "became_lead");
    if (!becameLead) return NextResponse.json({ contacts: [] });

    const allContacts = await fetchContactsByTagId(becameLead.id);
    const contacts = allContacts.filter((c) => !isTestUser(c.email));

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
