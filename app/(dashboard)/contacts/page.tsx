import {
  fetchAllContacts,
  fetchTags,
  fetchAllContactTags,
  fetchAllContactLists,
  fetchLists,
} from "@/lib/activecampaign";
import { formatTagName } from "@/lib/utils";
import { ContactsClient } from "./contacts-client";

export const dynamic = "force-dynamic";

async function getData() {
  const [contacts, allTags, allLists, allContactTags, allContactLists] = await Promise.all([
    fetchAllContacts(),
    fetchTags(),
    fetchLists(),
    fetchAllContactTags(),
    fetchAllContactLists(),
  ]);

  // Build lookup maps
  const tagMap = new Map(allTags.map((t) => [t.id, t.tag]));

  const listNames: Record<string, string> = {};
  for (const l of allLists) {
    listNames[l.id] = l.name;
  }

  const tagsByContact = new Map<string, string[]>();
  for (const ct of allContactTags) {
    if (!tagsByContact.has(ct.contact)) tagsByContact.set(ct.contact, []);
    tagsByContact.get(ct.contact)!.push(ct.tag);
  }

  const listsByContact = new Map<string, string[]>();
  for (const cl of allContactLists) {
    if (cl.status !== "1") continue;
    if (!listsByContact.has(cl.contact)) listsByContact.set(cl.contact, []);
    listsByContact.get(cl.contact)!.push(cl.list);
  }

  const enriched = contacts.map((c) => ({
    ...c,
    tagNames: (tagsByContact.get(c.id) ?? []).map((tagId) =>
      formatTagName(tagMap.get(tagId) ?? tagId)
    ),
    listIds: listsByContact.get(c.id) ?? [],
  }));

  // Sort: most recently signed up first
  enriched.sort((a, b) => {
    const ta = a.cdate ? new Date(a.cdate).getTime() : 0;
    const tb = b.cdate ? new Date(b.cdate).getTime() : 0;
    return tb - ta;
  });

  return { contacts: enriched, listNames };
}

export default async function ContactsPage() {
  const { contacts, listNames } = await getData();
  return <ContactsClient contacts={contacts} listNames={listNames} />;
}
