"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { List, Users, UserX, Calendar } from "lucide-react";
import type { ACList } from "@/lib/activecampaign";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

interface Props {
  lists: ACList[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const LIST_DESCRIPTIONS: Record<string, string> = {
  "Master Contact List": "All platform contacts — the primary audience for LicenseLinkUp broadcasts.",
  "Peer Contacts":       "Verified members who have passed peer review and joined the professional network.",
  "Lance Contacts":      "Personal contacts of Lance — warm leads and direct relationships.",
};

export function ListsClient({ lists }: Props) {
  const totalSubs   = lists.reduce((s, l) => s + Number(l.active_subscribers ?? 0), 0);
  const totalUnsubs = lists.reduce((s, l) => s + Number(l.unsubscriber_count ?? 0), 0);
  const maxSubs     = Math.max(...lists.map((l) => Number(l.active_subscribers ?? 0)));

  const pieData = lists.map((l) => ({
    name: l.name,
    value: Number(l.active_subscribers ?? 0),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lists"
        description={`${lists.length} lists · ${totalSubs.toLocaleString()} total subscribers`}
      >
        <CsvExportButton
          label="Export CSV"
          endpoint="/api/ac/lists"
          dataKey="lists"
          filename="licenselinkup-lists"
        />
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title="Total Lists"       value={lists.length}                  icon={List}   iconColor="text-blue-600"  iconBg="bg-blue-50" />
        <StatsCard title="Total Subscribers" value={totalSubs.toLocaleString()}    icon={Users}  iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatsCard title="Unsubscribers"     value={totalUnsubs.toLocaleString()}  icon={UserX}  iconColor="text-red-500"  iconBg="bg-red-50" />
      </div>

      {/* Charts + cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Distribution</CardTitle>
            <CardDescription>Share of subscribers across lists</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="45%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
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

        {/* List detail cards */}
        <div className="space-y-3">
          {lists.map((list, idx) => {
            const subs   = Number(list.active_subscribers ?? 0);
            const unsubs = Number(list.unsubscriber_count ?? 0);
            const pct    = maxSubs ? Math.round((subs / maxSubs) * 100) : 0;
            const desc   = LIST_DESCRIPTIONS[list.name] ?? "ActiveCampaign contact list.";
            return (
              <Card key={list.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] + "20" }}
                      >
                        <List className="h-4 w-4" style={{ color: COLORS[idx % COLORS.length] }} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{list.name}</p>
                        <p className="text-xs text-slate-500 max-w-xs">{desc}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-slate-900">{subs.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">subscribers</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{pct}% of largest list</span>
                      {unsubs > 0 && (
                        <span className="text-red-400">{unsubs} unsubscribed</span>
                      )}
                    </div>
                  </div>

                  {(list.cdate || list.udate) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      {list.cdate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Created {formatDate(list.cdate)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
