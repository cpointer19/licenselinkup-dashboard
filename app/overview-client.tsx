"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, Zap, Mail, Tag, TrendingUp, List } from "lucide-react";
import type { ACContact, ACAutomation, ACCampaign, ACList, ACTag } from "@/lib/activecampaign";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { ClaudeBot } from "@/components/claude-bot";
import { formatDate } from "@/lib/utils";

interface Props {
  contacts: ACContact[];
  automations: ACAutomation[];
  campaigns: ACCampaign[];
  lists: ACList[];
  tags: ACTag[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

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
    .map((t) => ({ name: t.tag, value: Number(t.subscriber_count ?? 0) }));
}

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

      {/* Claude Bot — weekly intelligence */}
      <ClaudeBot />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Contacts"
          value={contacts.length}
          subtitle="All time"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTotal)" name="Total" />
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
                  width={120}
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
              {recentContacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-6 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
                    </p>
                    <p className="truncate text-xs text-slate-400">{c.email}</p>
                  </div>
                  <span className="ml-4 flex-shrink-0 text-xs text-slate-400">{formatDate(c.cdate)}</span>
                </li>
              ))}
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
