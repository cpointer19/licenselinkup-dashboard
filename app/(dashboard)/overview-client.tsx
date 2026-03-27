"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, Zap, Mail, Tag, TrendingUp, List, ArrowRight, UserCheck, ClipboardCheck, Award, BarChart2 } from "lucide-react";
import Link from "next/link";
import type { ACContact, ACAutomation, ACCampaign, ACList, ACTag } from "@/lib/activecampaign";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { ClaudeBot } from "@/components/claude-bot";
import { formatDate, formatTagName } from "@/lib/utils";

interface Props {
  contacts: ACContact[];
  automations: ACAutomation[];
  campaigns: ACCampaign[];
  lists: ACList[];
  tags: ACTag[];
}

const COLORS = ["#5375FF", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

function groupByMonth(contacts: ACContact[]) {
  const map = new Map<string, number>();
  for (const c of contacts) {
    if (!c.cdate) continue;
    const d = new Date(c.cdate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  // running total
  let cum = 0;
  return sorted.map(([month, count]) => {
    cum += count;
    const [yr, mo] = month.split("-");
    const label = new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return { month: label, new: count, total: cum };
  });
}

function topTags(tags: ACTag[], n = 10) {
  return [...tags]
    .sort((a, b) => Number(b.subscriber_count ?? 0) - Number(a.subscriber_count ?? 0))
    .slice(0, n)
    .map((t) => ({
      name: (() => { const n = formatTagName(t.tag); return n.length > 22 ? n.slice(0, 20) + "…" : n; })(),
      value: Number(t.subscriber_count ?? 0),
    }));
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

export function OverviewClient({ contacts, automations, campaigns, lists, tags }: Props) {
  const growthData  = useMemo(() => groupByMonth(contacts), [contacts]);
  const tagData     = useMemo(() => topTags(tags, 8), [tags]);
  const listPieData = useMemo(
    () => lists.map((l) => ({ name: l.name, value: Number(l.active_subscribers ?? 0) })),
    [lists]
  );

  const totalOpens  = campaigns.reduce((s, c) => s + Number(c.uniqueopens ?? 0), 0);
  const totalSent   = campaigns.reduce((s, c) => s + Number(c.send_amt ?? 0), 0);
  const avgOpenRate = totalSent ? ((totalOpens / totalSent) * 100).toFixed(1) : "—";

  const activeAutos = automations.filter((a) => a.status === "1").length;

  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.cdate ?? 0).getTime() - new Date(a.cdate ?? 0).getTime())
    .slice(0, 8);

  // Pipeline data from tags
  const pipelineStages = useMemo(() => {
    const stageNames = ["became_lead", "profile_created", "onboarding_complete"];
    return stageNames.map((name) => {
      const tag = tags.find((t) => t.tag.toLowerCase() === name.toLowerCase());
      return { stage: name, count: Number(tag?.subscriber_count ?? 0) };
    });
  }, [tags]);

  const rejectedCount = useMemo(() => {
    const tag = tags.find((t) => t.tag.toLowerCase() === "founding_member_rejected");
    return Number(tag?.subscriber_count ?? 0);
  }, [tags]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`LicenseLinkUp · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
      >
        <CsvExportButton
          label="Export All Contacts"
          endpoint="/api/ac/contacts"
          dataKey="contacts"
          filename="licenselinkup-contacts"
        />
      </PageHeader>

      {/* Meta Ad Performance CTA */}
      <Link
        href="/meta-ads"
        className="flex items-center justify-between rounded-xl border border-[#5375FF]/20 bg-[#5375FF]/5 px-5 py-4 transition-colors hover:bg-[#5375FF]/10 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5375FF]/10">
            <BarChart2 className="h-4.5 w-4.5 text-[#5375FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Meta Ad Performance</p>
            <p className="text-xs text-slate-500">See which ads are driving the most leads, profile creations &amp; founding members</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#5375FF] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Conversion Pipeline */}
      <ConversionPipeline stages={pipelineStages} totalContacts={contacts.length} rejectedCount={rejectedCount} />

      {/* Claude Bot — weekly intelligence */}
      <ClaudeBot />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Contacts"
          value={contacts.length}
          subtitle="All time"
          icon={Users}
          iconColor="text-[#5375FF]"
          iconBg="bg-[#5375FF]/10"
        />
        <StatsCard
          title="Active Automations"
          value={activeAutos}
          subtitle={`of ${automations.length} total`}
          icon={Zap}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatsCard
          title="Campaigns Sent"
          value={campaigns.length}
          subtitle={`Avg open rate ${avgOpenRate}%`}
          icon={Mail}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Unique Tags"
          value={tags.length}
          subtitle="Across all contacts"
          icon={Tag}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contact growth */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Growth</CardTitle>
            <CardDescription>Monthly new subscribers &amp; cumulative total</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={240}>
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
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
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

        {/* List distribution */}
        <Card>
          <CardHeader>
            <CardTitle>List Distribution</CardTitle>
            <CardDescription>Subscribers per list</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={listPieData}
                  cx="40%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {listPieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top tags */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tags by Subscribers</CardTitle>
            <CardDescription>Most-used tags across all contacts</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tagData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={160}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="value" name="Contacts" radius={[0, 4, 4, 0]}>
                  {tagData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Contacts</CardTitle>
              <CardDescription>Latest 8 additions</CardDescription>
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

      {/* Lists summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 flex items-center gap-2">
          <List className="h-4 w-4 text-slate-400" /> Lists
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {lists.map((list, idx) => (
            <Card key={list.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-800">{list.name}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{Number(list.active_subscribers ?? 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500">subscribers</p>
                {list.unsubscriber_count && Number(list.unsubscriber_count) > 0 && (
                  <Badge variant="warning" className="mt-2">
                    {list.unsubscriber_count} unsubscribed
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
