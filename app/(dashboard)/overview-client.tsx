"use client";

import { useMemo } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowRight, UserCheck, ClipboardCheck, Award, MapPin } from "lucide-react";
import Link from "next/link";
import type { ACContact, ACTag } from "@/lib/activecampaign";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { ClaudeBot } from "@/components/claude-bot";
import { formatDate } from "@/lib/utils";

interface Props {
  contacts: ACContact[];
  tags: ACTag[];
}

function groupByDay(contacts: ACContact[]) {
  const map = new Map<string, number>();
  for (const c of contacts) {
    if (!c.cdate) continue;
    // Only chart contacts from 2026 onward (launch period)
    if (c.cdate < "2026-01-01") continue;
    const d = new Date(c.cdate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  let cum = 0;
  return sorted.map(([day, count]) => {
    cum += count;
    const [yr, mo, da] = day.split("-");
    const label = new Date(+yr, +mo - 1, +da).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { day: label, new: count, total: cum };
  });
}

// ─── Contact Classification ──────────────────────────────────────────────────

const REAL_LEAD_EMAILS = new Set([
  "germanyjohnson@kw.com",
  "mikeusa03@aol.com",
  "wade@wadewright.com",
]);

function isRealLead(email: string): boolean {
  return REAL_LEAD_EMAILS.has(email.toLowerCase());
}

// ─── Conversion Pipeline ──────────────────────────────────────────────────────

const PIPELINE_META = [
  { stage: "became_lead",         label: "Leads (Signup)",      subtext: "These people left their email on the landing page.",                                                                        icon: UserCheck,      color: "#5375FF", bg: "bg-[#5375FF]/10",    border: "border-[#5375FF]/20",    text: "text-[#5375FF]" },
  { stage: "profile_created",     label: "Profile Created",     subtext: "These people verified their email + left their name and role and continued through the sign up flow.",                      icon: ClipboardCheck, color: "#8b5cf6", bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700" },
  { stage: "onboarding_complete", label: "Founding Members",    subtext: "We've vetted these people and verified they have an active license.",                                                        icon: Award,          color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
];

function ConversionPipeline({ stages, totalContacts, rejectedCount }: { stages: { stage: string; count: number }[]; totalContacts: number; rejectedCount: number }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const firstCount = stages[0]?.count ?? 0;
  const lastCount = stages[stages.length - 1]?.count ?? 0;
  const overallRate = firstCount > 0 ? ((lastCount / firstCount) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Conversion Pipeline
            </CardTitle>
            <CardDescription>Landing page signup &rarr; Profile &rarr; Founding member</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {rejectedCount > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                <p className="text-xs text-slate-500">Rejected</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{overallRate}%</p>
              <p className="text-xs text-slate-500">Full conversion rate</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch gap-3">
          {stages.map((stage, idx) => {
            const meta = PIPELINE_META.find((m) => m.stage === stage.stage) ?? PIPELINE_META[0];
            const Icon = meta.icon;
            const barPct = Math.max((stage.count / maxCount) * 100, 8);
            const nextStage = stages[idx + 1];
            const advanceRate = nextStage && stage.count > 0
              ? ((nextStage.count / stage.count) * 100).toFixed(0)
              : null;

            return (
              <div key={stage.stage} className="flex items-center gap-3 flex-1">
                <div className={`flex-1 rounded-xl border ${meta.border} ${meta.bg} p-4 transition-all hover:shadow-md`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/80`}>
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${meta.text}`}>{stage.count.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">contacts</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                    {advanceRate && (
                      <span className="text-[10px] font-medium text-slate-400">{advanceRate}%</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Overview ────────────────────────────────────────────────────────────

export function OverviewClient({ contacts, tags }: Props) {
  const growthData  = useMemo(() => groupByDay(contacts), [contacts]);

  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.cdate ?? 0).getTime() - new Date(a.cdate ?? 0).getTime())
    .slice(0, 20);

  // Pipeline counts from AC tag subscriber_count (fast, no extra API calls)
  const rejectedCount = useMemo(() => {
    const tag = tags.find((t) => t.tag.toLowerCase() === "founding_member_rejected");
    return Number(tag?.subscriber_count ?? 0);
  }, [tags]);

  const pipelineStages = useMemo(() => {
    const stageNames = ["became_lead", "profile_created", "onboarding_complete"];
    return stageNames.map((name) => {
      const raw = Number(tags.find((t) => t.tag.toLowerCase() === name.toLowerCase())?.subscriber_count ?? 0);
      // Subtract rejected contacts from founding members count
      const count = name === "onboarding_complete" ? Math.max(0, raw - rejectedCount) : raw;
      return { stage: name, count };
    });
  }, [tags, rejectedCount]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`LicenseLinkUp · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
      >
        <CsvExportButton
          label="Export Leads"
          endpoint="/api/ac/leads"
          dataKey="contacts"
          filename="licenselinkup-leads"
        />
      </PageHeader>

      {/* Member Map CTA */}
      <Link
        href="/map"
        className="flex items-center justify-between rounded-xl border border-[#5375FF]/20 bg-[#5375FF]/5 px-5 py-4 transition-colors hover:bg-[#5375FF]/10 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5375FF]/10">
            <MapPin className="h-4.5 w-4.5 text-[#5375FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Member Map</p>
            <p className="text-xs text-slate-500">See where founding members are located across the country</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#5375FF] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Conversion Pipeline */}
      <ConversionPipeline stages={pipelineStages} totalContacts={contacts.length} rejectedCount={rejectedCount} />

      {/* Claude Bot — weekly intelligence */}
      <ClaudeBot />

      {/* Contact Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Growth</CardTitle>
          <CardDescription>Daily new contacts &amp; cumulative total</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5375FF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5375FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" stroke="#5375FF" strokeWidth={2} fill="url(#gradTotal)" name="Total" />
              <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradNew)" name="New" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent contacts */}
      <div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Contacts</CardTitle>
              <CardDescription>Latest 20 additions</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {recentContacts.map((c) => {
                const realLead = isRealLead(c.email);
                return (
                  <li key={c.id} className={`flex items-center justify-between px-6 py-2.5 ${realLead ? "bg-emerald-50/50" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
                        </p>
                        {realLead && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 flex-shrink-0">Real Lead</Badge>}
                      </div>
                      <p className="truncate text-xs text-slate-400">{c.email}</p>
                    </div>
                    <span className="ml-4 flex-shrink-0 text-xs text-slate-400">{formatDate(c.cdate)}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
