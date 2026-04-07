"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Mail, TrendingUp, MousePointer, UserX, AlertTriangle } from "lucide-react";
import type { ACCampaign } from "@/lib/activecampaign";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface Props {
  campaigns: ACCampaign[];
}

export function CampaignsClient({ campaigns: allCampaigns }: Props) {
  const [sort, setSort] = useState<"name" | "sent" | "opens" | "clicks">("name");

  const campaigns = allCampaigns.filter((c) => Number(c.send_amt) > 0);

  const sent   = campaigns.reduce((s, c) => s + Number(c.send_amt ?? 0), 0);
  const opens  = campaigns.reduce((s, c) => s + Number(c.uniqueopens ?? 0), 0);
  const clicks = campaigns.reduce((s, c) => s + Number(c.uniquelinkclicks ?? 0), 0);
  const unsubs = campaigns.reduce((s, c) => s + Number(c.unsubscribes ?? 0), 0);

  const avgOpen  = sent ? ((opens / sent) * 100).toFixed(1)  : "0";
  const avgClick = sent ? ((clicks / sent) * 100).toFixed(1) : "0";

  // Chart data: top 10 campaigns by opens
  const chartData = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => Number(b.uniqueopens) - Number(a.uniqueopens))
      .slice(0, 10)
      .map((c) => ({
        name: c.name.length > 18 ? c.name.slice(0, 17) + "…" : c.name,
        opens: Number(c.uniqueopens),
        clicks: Number(c.uniquelinkclicks),
        sent: Number(c.send_amt),
      }));
  }, [campaigns]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name);
      if (sort === "sent")   return Number(b.send_amt) - Number(a.send_amt);
      if (sort === "opens")  return Number(b.uniqueopens) - Number(a.uniqueopens);
      if (sort === "clicks") return Number(b.uniquelinkclicks) - Number(a.uniquelinkclicks);
      return 0;
    });
  }, [campaigns, sort]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description={`${campaigns.length} total campaigns`}
      >
        <CsvExportButton
          label="Export CSV"
          endpoint="/api/ac/campaigns"
          dataKey="campaigns"
          filename="licenselinkup-campaigns"
        />
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total Sent"    value={sent.toLocaleString()}   icon={Mail}          iconColor="text-[#5375FF]"    iconBg="bg-[#5375FF]/10" />
        <StatsCard title="Avg Open Rate" value={`${avgOpen}%`}           icon={TrendingUp}     iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatsCard title="Avg Click Rate" value={`${avgClick}%`}         icon={MousePointer}   iconColor="text-violet-600" iconBg="bg-violet-50" />
        <StatsCard title="Unsubscribes"  value={unsubs.toLocaleString()} icon={UserX}          iconColor="text-red-500"    iconBg="bg-red-50" />
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Campaigns by Opens &amp; Clicks</CardTitle>
          <CardDescription>Unique opens vs. unique link clicks</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="opens"  name="Unique Opens"  fill="#5375FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" name="Unique Clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Campaigns</CardTitle>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            Sort by:
            {(["name", "sent", "opens", "clicks"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded px-2 py-0.5 capitalize transition-colors ${sort === s ? "bg-[#5375FF]/10 text-[#5375FF] font-medium" : "hover:bg-slate-100"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Opens</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Bounces</TableHead>
              <TableHead className="text-right">Unsubs</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map((c) => {
              const openRate  = Number(c.send_amt) ? ((Number(c.uniqueopens) / Number(c.send_amt)) * 100).toFixed(1) : "—";
              const clickRate = Number(c.send_amt) ? ((Number(c.uniquelinkclicks) / Number(c.send_amt)) * 100).toFixed(1) : "—";
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium text-slate-800 max-w-[200px] truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.type}</p>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">{Number(c.send_amt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-slate-700">{Number(c.uniqueopens).toLocaleString()}</span>
                    <span className="ml-1 text-xs text-slate-400">({openRate}%)</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-slate-700">{Number(c.uniquelinkclicks).toLocaleString()}</span>
                    <span className="ml-1 text-xs text-slate-400">({clickRate}%)</span>
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{Number(c.hardbounces) + Number(c.softbounces)}</TableCell>
                  <TableCell className="text-right text-slate-500">{c.unsubscribes}</TableCell>
                  <TableCell className="text-xs text-slate-400">{formatDate(c.sdate)}</TableCell>
                </TableRow>
              );
            })}
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">No campaigns found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
