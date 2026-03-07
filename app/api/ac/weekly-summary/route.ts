import { NextResponse } from "next/server";
import { fetchAllContacts, fetchCampaigns, fetchContactAutomationsByAutomation, fetchAutomations } from "@/lib/activecampaign";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [contacts, campaigns, automations] = await Promise.all([
      fetchAllContacts(),
      fetchCampaigns(),
      fetchAutomations(),
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
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
