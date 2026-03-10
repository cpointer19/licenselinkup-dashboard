import { NextResponse } from "next/server";
import {
  fetchContactById,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
  fetchContactEmailActivities,
  fetchAutomations,
  fetchTags,
  fetchFields,
  fetchContactFieldValues,
} from "@/lib/activecampaign";

// UTM/attribution fields: AC perstag (lowercased) → display label
const UTM_FIELD_LABELS: Record<string, string> = {
  utm_source:       "Source",
  utm_medium:       "Medium",
  utm_campaign:     "Campaign",
  utm_content:      "Content",
  utm_term:         "Term",
  utm_id:           "Campaign ID",
  fbclid:           "Facebook Click ID",
  ad_id:            "Ad ID",
  adset_id:         "Ad Set ID",
  site_source_name: "Site Source",
  placement:        "Placement",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [contact, contactTags, lists, contactAutomations, emailActivities, allAutomations, allTags, allFields, fieldValues] = await Promise.all([
      fetchContactById(id),
      fetchContactTags(id),
      fetchContactLists(id),
      fetchContactAutomationsByContact(id),
      fetchContactEmailActivities(id).catch(() => []),
      fetchAutomations(),
      fetchTags(),
      fetchFields().catch(() => []),
      fetchContactFieldValues(id).catch(() => []),
    ]);

    // Build automation ID → name map
    const autoMap = new Map(allAutomations.map((a) => [a.id, a.name]));

    // Build tag ID → tag name map
    const tagMap = new Map(allTags.map((t) => [t.id, t.tag]));

    // Enrich automations with names, then deduplicate by automation ID
    // (AC can store multiple enrollment records per automation; keep the most recent)
    const enriched = contactAutomations.map((ca) => ({
      ...ca,
      automationName: autoMap.get(ca.automation) ?? null,
    }));
    const seen = new Map<string, typeof enriched[0]>();
    for (const ca of enriched) {
      const existing = seen.get(ca.automation);
      if (!existing || (ca.adddate ?? "") > (existing.adddate ?? "")) {
        seen.set(ca.automation, ca);
      }
    }
    const automations = Array.from(seen.values());

    // Resolve tag names
    const tags = contactTags.map((ct) => ({
      ...ct,
      tag: tagMap.get(ct.tag) ?? ct.tag,
    }));

    // Build field ID → UTM key map by matching perstag (lowercased) or title (lowercased)
    const fieldIdToUtmKey = new Map<string, string>();
    for (const f of allFields) {
      const byPerstag = f.perstag.toLowerCase();
      if (UTM_FIELD_LABELS[byPerstag]) {
        fieldIdToUtmKey.set(f.id, byPerstag);
        continue;
      }
      // Fallback: title lowercased with spaces → underscores
      const byTitle = f.title.toLowerCase().replace(/\s+/g, "_");
      if (UTM_FIELD_LABELS[byTitle]) {
        fieldIdToUtmKey.set(f.id, byTitle);
      }
    }

    // Build attribution: display label → value (only non-empty values)
    const attribution: Record<string, string> = {};
    for (const fv of fieldValues) {
      if (!fv.value) continue;
      const utmKey = fieldIdToUtmKey.get(fv.field);
      if (utmKey) {
        attribution[UTM_FIELD_LABELS[utmKey]] = fv.value;
      }
    }

    return NextResponse.json({ contact, tags, lists, automations, emailActivities, attribution });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
