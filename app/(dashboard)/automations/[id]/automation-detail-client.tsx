"use client";

import Link from "next/link";
import { ArrowLeft, Zap, CheckCircle, Clock, Users } from "lucide-react";
import type { ACAutomation, ACBlock, ACContactAutomation, ACContact } from "@/lib/activecampaign";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CsvExportButton } from "@/components/csv-export-button";
import { formatDate } from "@/lib/utils";

interface ContactRow extends ACContactAutomation {
  contactInfo: ACContact | null;
}

interface Props {
  automation: ACAutomation;
  blocks: ACBlock[];
  contacts: ContactRow[];
  totalContacts: number;
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "info" | "outline" | "warning" }> = {
  "1": { label: "Active",    variant: "info" },
  "2": { label: "Completed", variant: "success" },
  "0": { label: "Inactive",  variant: "outline" },
};

const BLOCK_ICONS: Record<string, string> = {
  send_email: "📧",
  wait: "⏱️",
  condition: "🔀",
  goal: "🎯",
  action: "⚡",
  notify: "🔔",
};

export function AutomationDetailClient({ automation, blocks, contacts, totalContacts }: Props) {
  const active    = contacts.filter((c) => c.status === "1").length;
  const completed = contacts.filter((c) => c.status === "2").length;
  const isActive  = automation.status === "1";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/automations">
            <ArrowLeft className="h-4 w-4 mr-1" /> Automations
          </Link>
        </Button>
        <span className="text-slate-400">/</span>
        <span className="text-sm font-medium text-slate-700">{automation.name}</span>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{automation.name}</h1>
                <p className="text-sm text-slate-500">ID: {automation.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "success" : "outline"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <CsvExportButton
                label="Export Contacts"
                endpoint={`/api/ac/automation/${automation.id}/contacts`}
                dataKey="contacts"
                filename={`automation-${automation.id}-contacts`}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-4">
            {[
              { label: "Entered",   value: automation.entered,  icon: Users,       color: "text-slate-600" },
              { label: "Exited",    value: automation.exited,   icon: CheckCircle, color: "text-emerald-600" },
              { label: "Active Now",value: String(active),      icon: Clock,       color: "text-[#5375FF]" },
              { label: "Completed", value: String(completed),   icon: CheckCircle, color: "text-emerald-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts ({totalContacts})</TabsTrigger>
          <TabsTrigger value="steps">Steps / Blocks ({blocks.length})</TabsTrigger>
        </TabsList>

        {/* Contacts tab */}
        <TabsContent value="contacts">
          <Card className="overflow-hidden">
            {totalContacts > 30 && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-700">Showing first 30 of {totalContacts} contacts.</p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => {
                  const name = c.contactInfo
                    ? [c.contactInfo.firstName, c.contactInfo.lastName].filter(Boolean).join(" ") || c.contactInfo.email
                    : `Contact #${c.contact}`;
                  const pct = c.totalElements !== "0"
                    ? Math.round((+c.completedElements / +c.totalElements) * 100)
                    : 0;
                  const st = STATUS_MAP[c.status] ?? { label: c.status, variant: "outline" as const };
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{name}</p>
                        {c.contactInfo && (
                          <p className="text-xs text-slate-400">{c.contactInfo.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-slate-500 w-8">{pct}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.completedElements}/{c.totalElements} steps</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDate(c.adddate)}</TableCell>
                    </TableRow>
                  );
                })}
                {contacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                      No contacts in this automation.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Steps tab */}
        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Automation Steps</CardTitle>
              <CardDescription>Blocks that make up this automation sequence</CardDescription>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <p className="text-sm text-slate-400">No step data available for this automation.</p>
              ) : (
                <ol className="space-y-2">
                  {blocks.map((block, idx) => (
                    <li key={block.id} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {idx + 1}
                      </span>
                      <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span>{BLOCK_ICONS[block.type] ?? "🔲"}</span>
                          <span className="text-sm font-medium text-slate-700">
                            {block.title ?? block.type}
                          </span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{block.type}</Badge>
                        </div>
                        {block.description && (
                          <p className="mt-1 text-xs text-slate-500">{block.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
