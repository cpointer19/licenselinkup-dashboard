import { NextResponse } from "next/server";
import {
  fetchAllContacts,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const allContacts = await fetchAllContacts();
    const contacts = allContacts.filter((c) => !isTestUser(c.email));

    // Enrich each contact with tags + lists + automations (parallel)
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const [tags, lists, automations] = await Promise.all([
            fetchContactTags(contact.id),
            fetchContactLists(contact.id),
            fetchContactAutomationsByContact(contact.id),
          ]);
          return { ...contact, tags, lists, automations };
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
