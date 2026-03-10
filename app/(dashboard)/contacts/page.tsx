import {
  fetchAllContacts,
  fetchTags,
  fetchContactTags,
  fetchContactLists,
} from "@/lib/activecampaign";
import { formatTagName } from "@/lib/utils";
import { ContactsClient } from "./contacts-client";

export const dynamic = "force-dynamic";

async function getData() {
  const [contacts, allTags] = await Promise.all([fetchAllContacts(), fetchTags()]);

  // Build a tag-id → tag-name map
  const tagMap = new Map(allTags.map((t) => [t.id, t.tag]));

  // Enrich with tags + lists in parallel
  const enriched = await Promise.all(
    contacts.map(async (c) => {
      try {
        const [ctags, clists] = await Promise.all([
          fetchContactTags(c.id),
          fetchContactLists(c.id),
        ]);
        return {
          ...c,
          tagNames: ctags.map((t) => formatTagName(tagMap.get(t.tag) ?? t.tag)),
          listIds: clists.filter((l) => l.status === "1").map((l) => l.list),
        };
      } catch {
        return { ...c, tagNames: [], listIds: [] };
      }
    })
  );

  // Sort: most recently signed up first
  enriched.sort((a, b) => {
    const ta = a.cdate ? new Date(a.cdate).getTime() : 0;
    const tb = b.cdate ? new Date(b.cdate).getTime() : 0;
    return tb - ta;
  });

  return { contacts: enriched };
}

export default async function ContactsPage() {
  const { contacts } = await getData();
  return <ContactsClient contacts={contacts} />;
}
