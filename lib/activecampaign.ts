/**
 * ActiveCampaign API client — server-side only.
 * Never import this in client components.
 */

const BASE = process.env.ACTIVECAMPAIGN_BASE_URL!;
const KEY  = process.env.ACTIVECAMPAIGN_API_KEY!;

const API = `${BASE}/api/3`;

async function acFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { "Api-Token": KEY },
    next: { revalidate: 60 }, // 1-min cache
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AC API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Automations ────────────────────────────────────────────────────────────

export interface ACAutomation {
  id: string;
  name: string;
  status: string;
  entered: string;
  exited: string;
  description?: string;
  cdate?: string;
  mdate?: string;
}

export async function fetchAutomations(): Promise<ACAutomation[]> {
  const data = await acFetch<{ automations: ACAutomation[] }>("/automations", { limit: "100" });
  return data.automations ?? [];
}

export async function fetchAutomationById(id: string) {
  const data = await acFetch<{ automation: ACAutomation }>(`/automations/${id}`);
  return data.automation;
}

// ─── Automation Steps / Blocks ───────────────────────────────────────────────

export interface ACBlock {
  id: string;
  automationid: string;
  type: string;
  title?: string;
  description?: string;
}

export async function fetchAutomationBlocks(id: string): Promise<ACBlock[]> {
  const data = await acFetch<{ blocks: ACBlock[] }>(`/automations/${id}/blocks`);
  return data.blocks ?? [];
}

// ─── Contact Automations (contacts in an automation) ────────────────────────

export interface ACContactAutomation {
  id: string;
  contact: string;
  automation: string;
  status: string;
  completedElements: string;
  totalElements: string;
  adddate?: string;
  completedate?: string;
}

export async function fetchContactAutomationsByAutomation(automationId: string): Promise<ACContactAutomation[]> {
  const all: ACContactAutomation[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ contactAutomations: ACContactAutomation[]; meta?: { total: string } }>(
      "/contactAutomations",
      { automation: automationId, limit: "100", offset: String(offset) }
    );
    const items = data.contactAutomations ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

export async function fetchContactAutomationsByContact(contactId: string): Promise<ACContactAutomation[]> {
  const data = await acFetch<{ contactAutomations: ACContactAutomation[] }>(
    `/contacts/${contactId}/contactAutomations`,
    { limit: "100" }
  );
  return data.contactAutomations ?? [];
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export interface ACCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sdate?: string;
  send_amt: string;
  uniqueopens: string;
  totalopens: string;
  uniquelinkclicks: string;
  totallinkclicks: string;
  bounces: string;
  unsubscribes: string;
  forwards: string;
  replies: string;
  hardbounces: string;
  softbounces: string;
}

export async function fetchCampaigns(): Promise<ACCampaign[]> {
  const all: ACCampaign[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ campaigns: ACCampaign[] }>("/campaigns", {
      limit: "100",
      offset: String(offset),
    });
    const items = data.campaigns ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface ACContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cdate?: string;
  udate?: string;
  score?: string;
}

export async function fetchAllContacts(): Promise<ACContact[]> {
  const all: ACContact[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ contacts: ACContact[] }>(
      "/contacts",
      { limit: "100", offset: String(offset), status: "-1" }
    );
    const items = data.contacts ?? [];
    all.push(...items);
    if (items.length < 100 || all.length >= 2000) break;
    offset += 100;
  }
  return all;
}

export async function fetchContactById(id: string): Promise<ACContact> {
  const data = await acFetch<{ contact: ACContact }>(`/contacts/${id}`);
  return data.contact;
}

// ─── Contact Tags ────────────────────────────────────────────────────────────

export interface ACContactTag {
  id: string;
  contact: string;
  tag: string;
  cdate?: string;
}

export async function fetchContactTags(contactId: string): Promise<ACContactTag[]> {
  const data = await acFetch<{ contactTags: ACContactTag[] }>(`/contacts/${contactId}/contactTags`);
  return data.contactTags ?? [];
}

/** Fetch ALL contact-tag relationships in bulk (much faster than per-contact calls) */
export async function fetchAllContactTags(): Promise<ACContactTag[]> {
  const all: ACContactTag[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ contactTags: ACContactTag[] }>(
      "/contactTags",
      { limit: "100", offset: String(offset) }
    );
    const items = data.contactTags ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

// ─── Contact Lists ───────────────────────────────────────────────────────────

export interface ACContactList {
  id: string;
  contact: string;
  list: string;
  status: string;
  sdate?: string;
  udate?: string;
}

export async function fetchContactLists(contactId: string): Promise<ACContactList[]> {
  const data = await acFetch<{ contactLists: ACContactList[] }>(`/contacts/${contactId}/contactLists`);
  return data.contactLists ?? [];
}

/** Fetch contact IDs for a specific list (for exclusion filtering) */
export async function fetchContactIdsByListId(listId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset = 0;
  while (true) {
    const data = await acFetch<{ contactLists: ACContactList[] }>(
      "/contactLists",
      { limit: "100", offset: String(offset), listid: listId }
    );
    const items = data.contactLists ?? [];
    for (const cl of items) ids.add(cl.contact);
    if (items.length < 100) break;
    offset += 100;
  }
  return ids;
}

/** Fetch ALL contact-list memberships in bulk */
export async function fetchAllContactLists(): Promise<ACContactList[]> {
  const all: ACContactList[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ contactLists: ACContactList[] }>(
      "/contactLists",
      { limit: "100", offset: String(offset) }
    );
    const items = data.contactLists ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export interface ACTag {
  id: string;
  tag: string;
  tagType: string;
  description?: string;
  subscriber_count?: string;
}

export async function fetchTags(): Promise<ACTag[]> {
  const all: ACTag[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ tags: ACTag[] }>("/tags", { limit: "100", offset: String(offset) });
    const items = data.tags ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

// ─── Lists ───────────────────────────────────────────────────────────────────

export interface ACList {
  id: string;
  name: string;
  stringid?: string;
  active_subscribers?: string;
  non_deleted_subscribers?: string;
  unsubscriber_count?: string;
  cdate?: string;
  udate?: string;
}

export async function fetchLists(): Promise<ACList[]> {
  const data = await acFetch<{ lists: ACList[] }>("/lists", { limit: "100" });
  return data.lists ?? [];
}

// ─── Custom Fields ───────────────────────────────────────────────────────────

export interface ACField {
  id: string;
  title: string;
  perstag: string;
}

export async function fetchFields(): Promise<ACField[]> {
  const data = await acFetch<{ fields: ACField[] }>("/fields", { limit: "100" });
  return data.fields ?? [];
}

export interface ACFieldValue {
  id: string;
  contact: string;
  field: string;
  value: string;
}

export async function fetchContactFieldValues(contactId: string): Promise<ACFieldValue[]> {
  const data = await acFetch<{ fieldValues: ACFieldValue[] }>(`/contacts/${contactId}/fieldValues`);
  return data.fieldValues ?? [];
}

/** Fetch ALL field values in bulk (much faster than per-contact calls) */
export async function fetchAllFieldValues(): Promise<ACFieldValue[]> {
  const all: ACFieldValue[] = [];
  let offset = 0;
  while (true) {
    const data = await acFetch<{ fieldValues: ACFieldValue[] }>(
      "/fieldValues",
      { limit: "100", offset: String(offset) }
    );
    const items = data.fieldValues ?? [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  return all;
}

// ─── Email Activities (for contact detail) ───────────────────────────────────

export interface ACEmailActivity {
  id?: string;
  type?: string;
  campaign?: string;
  campaignName?: string;
  message?: string;
  tstamp?: string;
}

export async function fetchContactEmailActivities(contactId: string): Promise<ACEmailActivity[]> {
  const data = await acFetch<{ emailActivities?: ACEmailActivity[]; activities?: { type: string; tstamp: string }[] }>(
    `/contacts/${contactId}/emailActivities`,
    { limit: "20" }
  );
  return (data.emailActivities ?? []) as ACEmailActivity[];
}
