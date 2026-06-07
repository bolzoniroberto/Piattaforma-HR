import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Download, Search, Users, FileCheck, UserCheck, RefreshCw } from "lucide-react";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

type ActivityStatus = "pending" | "started" | "closed" | "done" | "scheduled" | "completed";

interface ActivityRow {
  userId: string;
  fullName: string;
  email: string;
  department: string | null;
  selfAssessment: ActivityStatus;
  managerEvaluation: ActivityStatus;
  managerIds: string[];
  peerFeedback: { completed: number; total: number };
  calibration: ActivityStatus;
  interview: ActivityStatus;
  interviewSigns: { manager: boolean; employee: boolean };
}

const statusBadge = (status: ActivityStatus) => {
  const map: Record<ActivityStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    closed: { label: "Chiuso", variant: "default" },
    completed: { label: "Completato", variant: "default" },
    done: { label: "Fatto", variant: "default" },
    started: { label: "In corso", variant: "secondary" },
    scheduled: { label: "Schedulato", variant: "secondary" },
    pending: { label: "Da fare", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

function exportCsv(rows: ActivityRow[]) {
  const header = ["Nome", "Email", "Dipartimento", "Autovalutazione", "Val. Manager", "Feedback 360°", "Calibrazione", "Colloquio", "Firma Manager", "Firma Dipendente"];
  const lines = [
    header.join(";"),
    ...rows.map(r => [
      r.fullName,
      r.email ?? "",
      r.department ?? "",
      r.selfAssessment,
      r.managerEvaluation,
      `${r.peerFeedback.completed}/${r.peerFeedback.total}`,
      r.calibration,
      r.interview,
      r.interviewSigns.manager ? "Sì" : "No",
      r.interviewSigns.employee ? "Sì" : "No",
    ].join(";")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attivita_persone.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportXlsx(rows: ActivityRow[]) {
  const { utils, writeFile } = await import("xlsx");
  const data = rows.map(r => ({
    "Nome": r.fullName,
    "Email": r.email ?? "",
    "Dipartimento": r.department ?? "",
    "Autovalutazione": r.selfAssessment,
    "Val. Manager": r.managerEvaluation,
    "Feedback 360°": `${r.peerFeedback.completed}/${r.peerFeedback.total}`,
    "Calibrazione": r.calibration,
    "Colloquio": r.interview,
    "Firma Manager": r.interviewSigns.manager ? "Sì" : "No",
    "Firma Dipendente": r.interviewSigns.employee ? "Sì" : "No",
  }));
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Attività Persone");
  writeFile(wb, "attivita_persone.xlsx");
}

export default function AdminActivitiesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCycle, setSelectedCycle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "started" | "closed">("all");

  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/admin/evaluation-cycles"],
    enabled: !!user,
  });

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const active = cycles.find(c => c.status === "active") ?? cycles[0];
      setSelectedCycle(active.id);
    }
  }, [cycles, selectedCycle]);

  const { data: activities = [], isLoading, refetch } = useQuery<ActivityRow[]>({
    queryKey: ["/api/admin/activities", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/activities/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  const filtered = activities.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.fullName.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all") {
      const overallStatus =
        r.selfAssessment === "closed" && r.managerEvaluation === "closed" ? "closed"
        : r.selfAssessment === "pending" && r.managerEvaluation === "pending" ? "pending"
        : "started";
      if (overallStatus !== statusFilter) return false;
    }
    return true;
  });

  const stats = {
    selfDone: activities.filter(r => r.selfAssessment === "closed").length,
    mgrDone: activities.filter(r => r.managerEvaluation === "closed").length,
    peerDone: activities.filter(r => r.peerFeedback.total > 0 && r.peerFeedback.completed === r.peerFeedback.total).length,
    total: activities.length,
  };

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex items-start justify-between">
        <PageHeader
          context="PERFORMANCE"
          title="Attività Persone"
          description="Stato del processo di valutazione per ogni dipendente"
        />
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleziona ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI summary */}
      {activities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><FileCheck className="h-4 w-4" /> Autovalutazioni</CardDescription>
              <CardTitle className="text-2xl">{stats.selfDone}/{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.total > 0 ? (stats.selfDone / stats.total) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Valutazioni Manager</CardDescription>
              <CardTitle className="text-2xl">{stats.mgrDone}/{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.total > 0 ? (stats.mgrDone / stats.total) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Users className="h-4 w-4" /> Feedback 360° completati</CardDescription>
              <CardTitle className="text-2xl">{stats.peerDone}/{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.total > 0 ? (stats.peerDone / stats.total) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + export */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome o email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="pending">Da iniziare</SelectItem>
            <SelectItem value="started">In corso</SelectItem>
            <SelectItem value="closed">Chiuso</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Aggiorna
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportXlsx(filtered)}>
          <Download className="h-4 w-4 mr-2" /> Excel
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Caricamento...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nessun risultato</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Dipartimento</TableHead>
                    <TableHead>Autovalutazione</TableHead>
                    <TableHead>Val. Manager</TableHead>
                    <TableHead>Feedback 360°</TableHead>
                    <TableHead>Calibrazione</TableHead>
                    <TableHead>Colloquio</TableHead>
                    <TableHead>Firme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow
                      key={r.userId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/profile-performance/${r.userId}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{r.fullName}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.department ?? "—"}</TableCell>
                      <TableCell>{statusBadge(r.selfAssessment)}</TableCell>
                      <TableCell>{statusBadge(r.managerEvaluation)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{r.peerFeedback.completed}/{r.peerFeedback.total}</span>
                      </TableCell>
                      <TableCell>{statusBadge(r.calibration)}</TableCell>
                      <TableCell>{statusBadge(r.interview)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={r.interviewSigns.manager ? "default" : "outline"} className="text-xs">M</Badge>
                          <Badge variant={r.interviewSigns.employee ? "default" : "outline"} className="text-xs">D</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
