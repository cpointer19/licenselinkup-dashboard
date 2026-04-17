import { NextResponse } from "next/server";
import {
  fetchTags,
  fetchAllContacts,
  fetchAllContactTags,
  fetchContactById,
  fetchContactLists,
  fetchContactAutomationsByContact,
  type ACContact,
  type ACContactTag,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const [tags, listContacts, allContactTags] = await Promise.all([
      fetchTags(),
      fetchAllContacts(),
      fetchAllContactTags(),
    ]);

    const becameLead = tags.find((t) => t.tag.toLowerCase() === "became_lead");
    if (!becameLead) return NextResponse.json({ contacts: [] });

    // Exact set of contact IDs tagged with became_lead (client-side, since
    // AC's server-side tag= query param is silently ignored).
    const leadIds = new Set<string>();
    const tagsByContact = new Map<string, ACContactTag[]>();
    for (const ct of allContactTags) {
      if (ct.tag === becameLead.id) leadIds.add(ct.contact);
      const arr = tagsByContact.get(ct.contact) ?? [];
      arr.push(ct);
      tagsByContact.set(ct.contact, arr);
    }

    // Start with list-3 contacts we already have
    const fromList = listContacts.filter((c) => leadIds.has(c.id));
    const have = new Set(fromList.map((c) => c.id));

    // Fetch any tagged contacts not on list-3 individually by ID
    const missingIds = [...leadIds].filter((id) => !have.has(id));
    const fetched = await Promise.all(
      missingIds.map((id) => fetchContactById(id).catch(() => null))
    );
    const extra = fetched.filter((c): c is ACContact => c !== null);

    const contacts = [...fromList, ...extra].filter((c) => !isTestUser(c.email));

    // Enrich (reuse already-fetched tags; fetch lists + automations per contact)
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
