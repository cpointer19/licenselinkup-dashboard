"use client";

import Link from "next/link";
import { Zap, Users, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface AutomationEnriched {
  id: string;
  name: string;
  status: string;
  entered: string;
  exited: string;
  cdate?: string;
  mdate?: string;
  activeContacts: number;
  completedContacts: number;
  totalContacts: number;
}

interface Props {
  automations: AutomationEnriched[];
}

function statusBadge(status: string) {
  if (status === "1") return <Badge variant="success">Active</Badge>;
  if (status === "0") return <Badge variant="outline">Inactive</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export function AutomationsClient({ automations }: Props) {
  const active   = automations.filter((a) => a.status === "1").length;
  const inactive = automations.length - active;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description={`${active} active · ${inactive} inactive`}
      >
        <CsvExportButton
          label="Export CSV"
          endpoint="/api/ac/automations"
          dataKey="automations"
          filename="licenselinkup-automations"
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {automations.map((auto) => {
          const completionRate = auto.totalContacts
            ? Math.round((auto.completedContacts / auto.totalContacts) * 100)
            : 0;

          return (
            <Card key={auto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <Zap className="h-4 w-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-sm leading-tight line-clamp-2">{auto.name}</CardTitle>
                  </div>
                  {statusBadge(auto.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Users className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{auto.totalContacts}</p>
                    <p className="text-[10px] text-slate-400">Total</p>
                  </div>
                  <div className="rounded-lg bg-[#5375FF]/10 p-2">
                    <div className="flex items-center justify-center gap-1 text-[#5375FF]">
                      <Clock className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold text-[#5375FF]">{auto.activeContacts}</p>
                    <p className="text-[10px] text-[#5375FF]/60">Active</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold text-emerald-700">{auto.completedContacts}</p>
                    <p className="text-[10px] text-emerald-400">Done</p>
                  </div>
                </div>

                {/* Completion rate */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Completion rate</span>
                    <span className="font-semibold text-slate-700">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-1.5" />
                </div>

                {/* Entered / exited */}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Entered: <strong className="text-slate-700">{auto.entered}</strong></span>
                  <span>Exited: <strong className="text-slate-700">{auto.exited}</strong></span>
                </div>

                {/* View detail link */}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href={`/automations/${auto.id}`}>
                    View contacts & steps <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
