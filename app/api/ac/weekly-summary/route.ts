import { NextResponse } from "next/server";
import { fetchAllContacts, fetchCampaigns, fetchAutomations, fetchTags } from "@/lib/activecampaign";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [contacts, campaigns, automations, tags] = await Promise.all([
      fetchAllContacts(),
      fetchCampaigns(),
      fetchAutomations(),
      fetchTags(),
    ]);

    // New contacts this week
    const newContacts = contacts.filter((c) => {
      if (!c.cdate) return false;
      return new Date(c.cdate) >= oneWeekAgo;
    });

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

    // Pipeline funnel data from tags
    const pipelineTags = ["became_lead", "profile_created", "onboarding_complete"];
    const pipeline = pipelineTags.map((tagName) => {
      const tag = tags.find((t) => t.tag.toLowerCase() === tagName.toLowerCase());
      return {
        stage: tagName,
        count: Number(tag?.subscriber_count ?? 0),
      };
    });

    return NextResponse.json({
      week: {
        start: oneWeekAgo.toISOString().slice(0, 10),
        end:   new Date().toISOString().slice(0, 10),
      },
      newContacts: {
        count: newContacts.length,
        names: newContacts.slice(0, 5).map((c) => [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email),
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
      totalContacts: contacts.length,
      pipeline,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
