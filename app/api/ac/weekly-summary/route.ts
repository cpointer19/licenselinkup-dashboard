import { NextResponse } from "next/server";
import {
  fetchRecentContacts,
  fetchAllContacts,
  fetchAllContactTags,
  fetchContactById,
  fetchCampaigns,
  fetchAutomations,
  fetchTags,
  type ACContact,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [recentRaw, listContacts, allContactTags, campaigns, automations, tags] = await Promise.all([
      fetchRecentContacts(oneWeekAgo),
      fetchAllContacts(),
      fetchAllContactTags(),
      fetchCampaigns(),
      fetchAutomations(),
      fetchTags(),
    ]);

    // --- Resolve full set of Lead contacts (same logic as /api/ac/leads) ---
    const becameLead = tags.find((t) => t.tag.toLowerCase() === "became_lead");
    const leadIds = new Set<string>();
    if (becameLead) {
      for (const ct of allContactTags) {
        if (ct.tag === becameLead.id) leadIds.add(ct.contact);
      }
    }

    const fromList = listContacts.filter((c) => leadIds.has(c.id));
    const have = new Set(fromList.map((c) => c.id));
    const missingIds = [...leadIds].filter((id) => !have.has(id));
    const fetched = await Promise.all(
      missingIds.map((id) => fetchContactById(id).catch(() => null))
    );
    const extra = fetched.filter((c): c is ACContact => c !== null);
    const allLeads = [...fromList, ...extra].filter((c) => !isTestUser(c.email));

    // --- New Leads this week (leads created in last 7 days) ---
    const recentLeadIds = new Set(recentRaw.map((c) => c.id));
    const newLeads = allLeads.filter((c) => recentLeadIds.has(c.id));

    // Campaigns sent this week
    const recentCampaigns = campaigns.filter((c) => {
      if (!c.sdate) return false;
      return new Date(c.sdate) >= oneWeekAgo && c.status === "5";
    });

    // Automation activity this week
    const activeAutos = automations.filter((a) => a.status === "1");

    // Total campaign metrics this week
    const weekSent   = recentCampaigns.reduce((s, c) => s + Number(c.send_amt ?? 0), 0);
    const weekOpens  = recentCampaigns.reduce((s, c) => s + Number(c.uniqueopens ?? 0), 0);
    const weekClicks = recentCampaigns.reduce((s, c) => s + Number(c.uniquelinkclicks ?? 0), 0);
    const openRate   = weekSent ? ((weekOpens / weekSent) * 100).toFixed(1) : null;

    // Pipeline funnel data — matches the Overview scorecard sources
    const profileCreated = Number(
      tags.find((t) => t.tag.toLowerCase() === "profile_created")?.subscriber_count ?? 0
    );
    const leadsCount = Number(becameLead?.subscriber_count ?? allLeads.length);
    // Founding Members = unique contacts with founding_member_approved tag
    const foundingMembersCount = Number(
      tags.find((t) => t.tag.toLowerCase() === "founding_member_approved")?.subscriber_count ?? 0
    );
    const pipeline = [
      { stage: "became_lead",         count: leadsCount },
      { stage: "profile_created",     count: profileCreated },
      { stage: "onboarding_complete", count: foundingMembersCount },
    ];

    return NextResponse.json({
      week: {
        start: oneWeekAgo.toISOString().slice(0, 10),
        end:   new Date().toISOString().slice(0, 10),
      },
      newContacts: {
        count: newLeads.length,
        names: newLeads.slice(0, 5).map((c) => [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email),
      },
      campaigns: {
        count:      recentCampaigns.length,
        sent:       weekSent,
        opens:      weekOpens,
        clicks:     weekClicks,
        openRate,
        topName:    recentCampaigns[0]?.name ?? null,
      },
      automations: {
        active: activeAutos.length,
        total:  automations.length,
      },
      totalContacts: leadsCount,
      pipeline,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
