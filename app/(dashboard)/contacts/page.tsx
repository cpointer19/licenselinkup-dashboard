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

  // Sort: real leads first, then by pipeline stage (became_lead > profile_created > onboarding_complete)
  const REAL_LEADS = new Set(["germanyjohnson@kw.com", "mikeusa03@aol.com", "wade@wadewright.com"]);
  const STAGE_TAGS = ["became_lead", "profile_created", "onboarding_complete"];

  function contactSortKey(c: { email: string; tagNames: string[] }) {
    if (REAL_LEADS.has(c.email.toLowerCase())) return 0;
    for (let i = 0; i < STAGE_TAGS.length; i++) {
      const formatted = formatTagName(STAGE_TAGS[i]);
      if (c.tagNames.some((t) => t.toLowerCase() === formatted.toLowerCase())) return i + 1;
    }
    return STAGE_TAGS.length + 1;
  }

  enriched.sort((a, b) => contactSortKey(a) - contactSortKey(b));

  return { contacts: enriched };
}

export default async function ContactsPage() {
  const { contacts } = await getData();
  return <ContactsClient contacts={contacts} />;
}
