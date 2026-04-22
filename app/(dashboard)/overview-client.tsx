"use client";

import { useMemo } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowRight, UserCheck, ClipboardCheck, Award, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import type { ACContact, ACTag } from "@/lib/activecampaign";
import { MAP_CONTACTS } from "@/lib/map-contacts";
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
  { stage: "leads_2026",          label: "Leads",                subtext: "These people left an email on licenselinkup.com.",                                                    icon: UserCheck,      color: "#5375FF", bg: "bg-[#5375FF]/10",    border: "border-[#5375FF]/20",    text: "text-[#5375FF]" },
  { stage: "profile_created",     label: "Profile Created",      subtext: "Continued through the sign up flow. Created an account, verified their email, and provided their name + role.", icon: ClipboardCheck, color: "#8b5cf6", bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700" },
  { stage: "provided_license",    label: "Provided a License",   subtext: "These people provided a license. Shown as pins on the Member Map.",                                   icon: FileText,       color: "#06b6d4", bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700"   },
{ stage: "founding_members",    label: "Founding Members",     subtext: "Fully vetted, verified license and have been sent a Founding Member approval email.",                 icon: Award,          color: "#f59e0b", bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700"  },
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
              <div key={stage.stage} className="flex items-stretch gap-2 flex-1">
                <div className={`flex-1 rounded-xl border ${meta.border} ${meta.bg} p-4 transition-all hover:shadow-md flex flex-col`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 flex-shrink-0`}>
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <span className={`text-xs font-semibold ${meta.text} leading-tight`}>{meta.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${meta.text}`}>{stage.count.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">contacts</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 leading-snug">{meta.subtext}</p>
                </div>
                {idx < stages.length - 1 && (
                  <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 pt-6">
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
    // 1. Leads — count from the became_lead tag's subscriber_count
    //    (matches the AC tag count exactly)
    const leads2026Count = Number(
      tags.find((t) => t.tag.toLowerCase() === "became_lead")?.subscriber_count ?? 0
    );

    // 2. Profile Created — from AC tag subscriber_count
    const profileCreatedCount = Number(
      tags.find((t) => t.tag.toLowerCase() === "profile_created")?.subscriber_count ?? 0
    );

    // 3. Provided a License — pins on Member Map
    const providedLicenseCount = MAP_CONTACTS.length;

    // 4. Founding Members — unique contacts with founding_member_approved tag
    const foundingMembersCount = Number(
      tags.find((t) => t.tag.toLowerCase() === "founding_member_approved")?.subscriber_count ?? 0
    );

    return [
      { stage: "leads_2026",       count: leads2026Count },
      { stage: "profile_created",  count: profileCreatedCount },
      { stage: "provided_license", count: providedLicenseCount },
      { stage: "founding_members", count: foundingMembersCount },
    ];
  }, [tags]);

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
