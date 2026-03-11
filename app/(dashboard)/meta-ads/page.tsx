import {
  fetchAllContacts,
  fetchTags,
  fetchFields,
  fetchAllContactTags,
  fetchAllFieldValues,
  type ACField,
} from "@/lib/activecampaign";
import { fetchMetaAdSpend } from "@/lib/meta";
import { isTestUser } from "@/lib/utils";
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
  // Preserve Meta's > separator convention, just use › for display
  return raw
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" › ");
}

async function getData(): Promise<{ ads: AdRow[]; totalSpend: number | null; totalLeadsAllTime: number; totalProfilesAllTime: number }> {
  // Bulk fetch everything in parallel — replaces 700+ per-contact calls
  const [contacts, allTags, allFields, allContactTags, allFieldValues, totalSpend] = await Promise.all([
    fetchAllContacts(),
    fetchTags(),
    fetchFields(),
    fetchAllContactTags(),
    fetchAllFieldValues(),
    fetchMetaAdSpend(),
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
  const utmTermFieldId = utmKeyToFieldId.get("utm_term");

  // Build tag lookup map (needed for both all-time counts and ad attribution below)
  const tagsByContact = new Map<string, string[]>();
  for (const ct of allContactTags) {
    const name = tagIdToName.get(ct.tag) ?? "";
    if (!name) continue;
    if (!tagsByContact.has(ct.contact)) tagsByContact.set(ct.contact, []);
    tagsByContact.get(ct.contact)!.push(name);
  }

  // Count all-time leads/profiles using same filtering as pipeline-contacts API:
  // exclude test users, founding_member_rejected, and peer_review_invited (for leads)
  const KNOWN_LEADS = new Set([
    "germanyjohnson@kw.com",
    "mikeusa03@aol.com",
    "wade@wadewright.com",
  ]);

  let totalLeadsAllTime = 0;
  let totalProfilesAllTime = 0;
  const leadEmailsSeen = new Set<string>();

  for (const c of contacts) {
    if (isTestUser(c.email)) continue;
    const tagNames = tagsByContact.get(c.id) ?? [];
    if (tagNames.includes("founding_member_rejected")) continue;
    if (tagNames.includes("became_lead") && !tagNames.includes("peer_review_invited")) {
      totalLeadsAllTime++;
      leadEmailsSeen.add(c.email.toLowerCase());
    }
    if (tagNames.includes("profile_created")) totalProfilesAllTime++;
  }
  // Add any KNOWN_LEADS not already counted
  for (const c of contacts) {
    if (KNOWN_LEADS.has(c.email.toLowerCase()) && !leadEmailsSeen.has(c.email.toLowerCase())) {
      const tagNames = tagsByContact.get(c.id) ?? [];
      if (!tagNames.includes("peer_review_invited")) totalLeadsAllTime++;
    }
  }

  if (!utmContentFieldId && !utmCampaignFieldId) return { ads: [], totalSpend, totalLeadsAllTime, totalProfilesAllTime };

  const fieldValuesByContact = new Map<string, typeof allFieldValues>();
  for (const fv of allFieldValues) {
    if (!fieldValuesByContact.has(fv.contact)) fieldValuesByContact.set(fv.contact, []);
    fieldValuesByContact.get(fv.contact)!.push(fv);
  }

  // Process each contact using lookup maps (no extra API calls)
  const adMap = new Map<string, { rawAdName: string; rawAdset: string; becameLead: number; profileCreated: number; foundingMember: number; siteSource: string | null }>();

  for (const c of contacts) {
    const tagNames = tagsByContact.get(c.id) ?? [];
    const fvalues = fieldValuesByContact.get(c.id) ?? [];

    const utmContent = utmContentFieldId
      ? (fvalues.find((fv) => fv.field === utmContentFieldId)?.value ?? null)
      : null;
    const utmCampaign = utmCampaignFieldId
      ? (fvalues.find((fv) => fv.field === utmCampaignFieldId)?.value ?? null)
      : null;
    const utmTerm = utmTermFieldId
      ? (fvalues.find((fv) => fv.field === utmTermFieldId)?.value ?? null)
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

    const rawAdName =
      (utmContent?.includes(">") ? utmContent : null) ??
      (utmCampaign?.includes(">") ? utmCampaign : null) ??
      utmContent ??
      utmCampaign ??
      null;

    if (!rawAdName) continue;

    // Group by ad + adset so same creative in different ad sets shows as separate rows
    const rawAdset = utmTerm ?? "";
    const adKey = `${rawAdName}||${rawAdset}`;

    if (!adMap.has(adKey)) {
      adMap.set(adKey, { rawAdName, rawAdset, becameLead: 0, profileCreated: 0, foundingMember: 0, siteSource: null });
    }
    const entry = adMap.get(adKey)!;
    if (tagNames.includes("became_lead")) entry.becameLead++;
    if (tagNames.includes("profile_created")) entry.profileCreated++;
    if (tagNames.includes("onboarding_complete")) entry.foundingMember++;
    if (!entry.siteSource && siteSource) entry.siteSource = siteSource;
  }

  const ads: AdRow[] = Array.from(adMap.values())
    .map((entry) => ({
      rawAdName: entry.rawAdName,
      adName: formatAdName(entry.rawAdName),
      rawAdset: entry.rawAdset,
      adsetName: entry.rawAdset ? formatAdName(entry.rawAdset) : null,
      becameLead: entry.becameLead,
      profileCreated: entry.profileCreated,
      foundingMember: entry.foundingMember,
      siteSource: entry.siteSource,
    }))
    .filter((a) => a.becameLead > 0)
    // Drop rows where the ad name looks like a raw UTM field name (bad tracking data)
    .filter((a) => !a.rawAdName.toLowerCase().startsWith("utm_"))
    .sort((a, b) => b.becameLead - a.becameLead);

  return { ads, totalSpend, totalLeadsAllTime, totalProfilesAllTime };
}

export default async function MetaAdsPage() {
  const { ads, totalSpend, totalLeadsAllTime, totalProfilesAllTime } = await getData();
  return <MetaAdsClient ads={ads} totalSpend={totalSpend} totalLeadsAllTime={totalLeadsAllTime} totalProfilesAllTime={totalProfilesAllTime} />;
}
