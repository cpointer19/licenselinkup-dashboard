import { NextResponse } from "next/server";
import {
  fetchContactById,
  fetchContactTags,
  fetchContactLists,
  fetchContactAutomationsByContact,
  fetchContactEmailActivities,
} from "@/lib/activecampaign";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [contact, tags, lists, automations, emailActivities] = await Promise.all([
      fetchContactById(id),
      fetchContactTags(id),
      fetchContactLists(id),
      fetchContactAutomationsByContact(id),
      fetchContactEmailActivities(id).catch(() => []),
    ]);

    return NextResponse.json({ contact, tags, lists, automations, emailActivities });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
