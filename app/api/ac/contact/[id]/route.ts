import { NextResponse } from "next/server";
import {
  fetchContactById,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
  fetchContactEmailActivities,
  fetchAutomations,
  fetchTags,
} from "@/lib/activecampaign";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [contact, contactTags, lists, contactAutomations, emailActivities, allAutomations, allTags] = await Promise.all([
      fetchContactById(id),
      fetchContactTags(id),
      fetchContactLists(id),
      fetchContactAutomationsByContact(id),
      fetchContactEmailActivities(id).catch(() => []),
      fetchAutomations(),
      fetchTags(),
    ]);

    // Build automation ID → name map
    const autoMap = new Map(allAutomations.map((a) => [a.id, a.name]));

    // Build tag ID → tag name map
    const tagMap = new Map(allTags.map((t) => [t.id, t.tag]));

    // Enrich automations with names
    const automations = contactAutomations.map((ca) => ({
      ...ca,
      automationName: autoMap.get(ca.automation) ?? null,
    }));

    // Resolve tag names
    const tags = contactTags.map((ct) => ({
      ...ct,
      tag: tagMap.get(ct.tag) ?? ct.tag,
    }));

    return NextResponse.json({ contact, tags, lists, automations, emailActivities });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
