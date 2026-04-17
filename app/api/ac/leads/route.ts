import { NextResponse } from "next/server";
import {
  fetchTags,
  fetchAllContacts,
  fetchAllContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const [tags, allContacts, allContactTags] = await Promise.all([
      fetchTags(),
      fetchAllContacts(),
      fetchAllContactTags(),
    ]);

    const becameLead = tags.find((t) => t.tag.toLowerCase() === "became_lead");
    if (!becameLead) return NextResponse.json({ contacts: [] });

    // Build exact set of contact IDs tagged with became_lead (client-side filter,
    // since AC's server-side tag= query param is silently ignored).
    const leadIds = new Set<string>();
    const tagsByContact = new Map<string, typeof allContactTags>();
    for (const ct of allContactTags) {
      if (ct.tag === becameLead.id) leadIds.add(ct.contact);
      const arr = tagsByContact.get(ct.contact) ?? [];
      arr.push(ct);
      tagsByContact.set(ct.contact, arr);
    }

    // Filter list-3 contacts to only those with the tag
    const contacts = allContacts.filter(
      (c) => !isTestUser(c.email) && leadIds.has(c.id)
    );

    // Enrich (reuse already-fetched contactTags; lists + automations per-contact)
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const [lists, automations] = await Promise.all([
            fetchContactLists(contact.id),
            fetchContactAutomationsByContact(contact.id),
          ]);
          return {
            ...contact,
            tags: tagsByContact.get(contact.id) ?? [],
            lists,
            automations,
          };
        } catch {
          return {
            ...contact,
            tags: tagsByContact.get(contact.id) ?? [],
            lists: [],
            automations: [],
          };
        }
      })
    );

    return NextResponse.json({ contacts: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
