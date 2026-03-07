"use client";

import { useState, useMemo } from "react";
import { Search, Tag } from "lucide-react";
import type { ACTag } from "@/lib/activecampaign";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Props {
  tags: ACTag[];
}

function isStateTag(tag: string) {
  return /^State_[A-Z]{2}$/.test(tag);
}

function isFunnelTag(tag: string) {
  return ["Founding Applicant", "Verified Member", "Peer Contacts"].some((t) =>
    tag.toLowerCase().includes(t.toLowerCase())
  );
}

function tagColor(count: number, max: number) {
  const pct = max ? count / max : 0;
  if (pct > 0.66) return "bg-blue-600 text-white";
  if (pct > 0.33) return "bg-blue-200 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

export function TagsClient({ tags }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? tags.filter((t) => t.tag.toLowerCase().includes(q)) : tags;
  }, [tags, search]);

  const stateTags = filtered.filter((t) => isStateTag(t.tag)).sort((a, b) =>
    Number(b.subscriber_count ?? 0) - Number(a.subscriber_count ?? 0)
  );
  const funnelTags = filtered.filter((t) => isFunnelTag(t.tag));
  const otherTags  = filtered.filter((t) => !isStateTag(t.tag) && !isFunnelTag(t.tag)).sort((a, b) =>
    Number(b.subscriber_count ?? 0) - Number(a.subscriber_count ?? 0)
  );

  const allSorted = [...filtered].sort((a, b) => Number(b.subscriber_count ?? 0) - Number(a.subscriber_count ?? 0));
  const maxCount  = Number(allSorted[0]?.subscriber_count ?? 0);

  const totalSubscriberTaggings = tags.reduce((s, t) => s + Number(t.subscriber_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description={`${tags.length} unique tags · ${totalSubscriberTaggings.toLocaleString()} total taggings`}
      >
        <CsvExportButton
          label="Export CSV"
          endpoint="/api/ac/tags"
          dataKey="tags"
          filename="licenselinkup-tags"
        />
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search tags…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="cloud">
        <TabsList>
          <TabsTrigger value="cloud">Tag Cloud</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        {/* Tag cloud */}
        <TabsContent value="cloud" className="space-y-5">
          {funnelTags.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4 text-blue-500" /> Funnel Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {funnelTags.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-full px-3 py-1 text-sm font-medium cursor-default ${tagColor(Number(t.subscriber_count ?? 0), maxCount)}`}
                    >
                      {t.tag}
                      <span className="ml-1.5 opacity-70 text-xs">({t.subscriber_count ?? 0})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>All Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {otherTags.map((t) => {
                  const count = Number(t.subscriber_count ?? 0);
                  const pct   = maxCount ? count / maxCount : 0;
                  const size  = pct > 0.5 ? "text-base" : pct > 0.2 ? "text-sm" : "text-xs";
                  return (
                    <div
                      key={t.id}
                      className={`rounded-full px-3 py-1 font-medium cursor-default transition-transform hover:scale-105 ${size} ${tagColor(count, maxCount)}`}
                    >
                      {t.tag}
                      <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table view */}
        <TabsContent value="table">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Subscribers</TableHead>
                  <TableHead>Bar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSorted.map((t) => {
                  const count = Number(t.subscriber_count ?? 0);
                  const pct   = maxCount ? (count / maxCount) * 100 : 0;
                  let category = "General";
                  if (isStateTag(t.tag)) category = "State";
                  else if (isFunnelTag(t.tag)) category = "Funnel";
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-slate-800">{t.tag}</TableCell>
                      <TableCell>
                        <Badge variant={category === "Funnel" ? "default" : category === "State" ? "info" : "secondary"} className="text-[10px]">
                          {category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-700">{count.toLocaleString()}</TableCell>
                      <TableCell className="min-w-[100px]">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle>State Tags</CardTitle>
              <p className="text-sm text-slate-500">Geographic distribution of contacts by state</p>
            </CardHeader>
            <CardContent>
              {stateTags.length === 0 ? (
                <p className="text-sm text-slate-400">No state tags found matching search.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {stateTags.map((t) => {
                    const count = Number(t.subscriber_count ?? 0);
                    const state = t.tag.replace("State_", "");
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{state}</p>
                          <p className="text-xs text-slate-400">contacts</p>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
