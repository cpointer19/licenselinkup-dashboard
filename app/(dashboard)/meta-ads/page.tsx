import {
  fetchAllContacts,
  fetchTags,
  fetchFields,
  fetchAllContactTags,
  fetchAllFieldValues,
  type ACField,
} from "@/lib/activecampaign";
import { MetaAdsClient, type AdRow } from "./meta-ads-client";

export const dynamic = "force-dynamic";

const UTM_KEYS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "utm_id", "fbclid", "ad_id", "adset_id", "site_source_name", "placement",
]);

function getUtmKey(f: ACField): string | null {
  const byPerstag = f.perstag.toLowerCase();
  if (UTM_KEYS.has(byPerstag)) return byPerstag;
  const byTitle = f.title.toLowerCase().replace(/\s+/g, "_");
  if (UTM_KEYS.has(byTitle)) return byTitle;
  return null;
}

function formatAdName(raw: string): string {
  return raw
    .replace(/>/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter((w) => !/^\d{8}$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

async function getData(): Promise<{ ads: AdRow[] }> {
  // Bulk fetch everything in parallel — replaces 700+ per-contact calls
  const [contacts, allTags, allFields, allContactTags, allFieldValues] = await Promise.all([
    fetchAllContacts(),
    fetchTags(),
    fetchFields(),
    fetchAllContactTags(),
    fetchAllFieldValues(),
  ]);

  const tagIdToName = new Map(allTags.map((t) => [t.id, t.tag.toLowerCase()]));

  const utmKeyToFieldId = new Map<string, string>();
  for (const f of allFields) {
    const key = getUtmKey(f);
    if (key) utmKeyToFieldId.set(key, f.id);
  }

  const utmContentFieldId = utmKeyToFieldId.get("utm_content");
  const utmCampaignFieldId = utmKeyToFieldId.get("utm_campaign");
  const siteSourceFieldId = utmKeyToFieldId.get("site_source_name");
  const utmSourceFieldId = utmKeyToFieldId.get("utm_source");

  if (!utmContentFieldId && !utmCampaignFieldId) return { ads: [] };

  // Build lookup maps keyed by contact ID
  const tagsByContact = new Map<string, string[]>();
  for (const ct of allContactTags) {
    const name = tagIdToName.get(ct.tag) ?? "";
    if (!name) continue;
    if (!tagsByContact.has(ct.contact)) tagsByContact.set(ct.contact, []);
    tagsByContact.get(ct.contact)!.push(name);
  }

  const fieldValuesByContact = new Map<string, typeof allFieldValues>();
  for (const fv of allFieldValues) {
    if (!fieldValuesByContact.has(fv.contact)) fieldValuesByContact.set(fv.contact, []);
    fieldValuesByContact.get(fv.contact)!.push(fv);
  }

  // Process each contact using lookup maps (no extra API calls)
  const adMap = new Map<string, { becameLead: number; profileCreated: number; foundingMember: number; siteSource: string | null }>();

  for (const c of contacts) {
    const tagNames = tagsByContact.get(c.id) ?? [];
    const fvalues = fieldValuesByContact.get(c.id) ?? [];

    const utmContent = utmContentFieldId
      ? (fvalues.find((fv) => fv.field === utmContentFieldId)?.value ?? null)
      : null;
    const utmCampaign = utmCampaignFieldId
      ? (fvalues.find((fv) => fv.field === utmCampaignFieldId)?.value ?? null)
      : null;
    const siteSourceRaw = siteSourceFieldId
      ? (fvalues.find((fv) => fv.field === siteSourceFieldId)?.value ?? null)
      : null;
    const utmSourceRaw = utmSourceFieldId
      ? (fvalues.find((fv) => fv.field === utmSourceFieldId)?.value ?? null)
      : null;

    const rawSource = (siteSourceRaw || utmSourceRaw || "").toLowerCase();
    const siteSource = rawSource.includes("instagram") || rawSource === "ig"
      ? "instagram"
      : rawSource.includes("facebook") || rawSource === "fb"
      ? "facebook"
      : (siteSourceRaw || utmSourceRaw || null);

    const adKey =
      (utmContent?.includes(">") ? utmContent : null) ??
      (utmCampaign?.includes(">") ? utmCampaign : null) ??
      utmContent ??
      utmCampaign ??
      null;

    if (!adKey) continue;

    if (!adMap.has(adKey)) {
      adMap.set(adKey, { becameLead: 0, profileCreated: 0, foundingMember: 0, siteSource: null });
    }
    const entry = adMap.get(adKey)!;
    if (tagNames.includes("became_lead")) entry.becameLead++;
    if (tagNames.includes("profile_created")) entry.profileCreated++;
    if (tagNames.includes("onboarding_complete")) entry.foundingMember++;
    if (!entry.siteSource && siteSource) entry.siteSource = siteSource;
  }

  const ads: AdRow[] = Array.from(adMap.entries())
    .map(([raw, counts]) => ({
      rawAdName: raw,
      adName: formatAdName(raw),
      becameLead: counts.becameLead,
      profileCreated: counts.profileCreated,
      foundingMember: counts.foundingMember,
      siteSource: counts.siteSource,
    }))
    .filter((a) => a.becameLead > 0)
    .sort((a, b) => b.becameLead - a.becameLead);

  return { ads };
}

export default async function MetaAdsPage() {
  const { ads } = await getData();
  return <MetaAdsClient ads={ads} />;
}
