import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileSignature, Pencil } from "lucide-react";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface Interview {
  id?: string;
  status: string;
  scheduledAt: number | null;
  completedAt: number | null;
  outcome: string | null;
  notes: string | null;
  managerSignedAt: number | null;
  employeeSignedAt: number | null;
}

interface InterviewForm {
  scheduledAt: string;
  notes: string;
  outcome: string;
  status: string;
}

export default function ManagerInterviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState("");
  const [editEmployee, setEditEmployee] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<InterviewForm>({ scheduledAt: "", notes: "", outcome: "", status: "pending" });

  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/evaluation-cycles"],
    enabled: !!user,
  });

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const active = cycles.find(c => c.status === "active") ?? cycles[0];
      setSelectedCycle(active.id);
    }
  }, [cycles, selectedCycle]);

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/manager/team-members"],
    enabled: !!user,
  });

  const { data: interviews = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/interviews", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/interviews/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/interviews", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/interviews", selectedCycle] });
      toast({ title: "Colloquio salvato" });
      setEditEmployee(null);
    },
    onError: () => {
      toast({ title: "Errore salvataggio", variant: "destructive" });
    },
  });

  const signMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await apiRequest("POST", `/api/interviews/${selectedCycle}/sign`, { employeeUserId: employeeId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/interviews", selectedCycle] });
      toast({ title: "Firma apposta" });
    },
    onError: () => {
      toast({ title: "Errore firma", variant: "destructive" });
    },
  });

  function openEdit(member: TeamMember) {
    const interview = interviews.find(i => i.employeeUserId === member.id);
    setEditEmployee(member);
    setForm({
      scheduledAt: interview?.scheduledAt ? new Date(interview.scheduledAt * 1000).toISOString().slice(0, 10) : "",
      notes: interview?.notes ?? "",
      outcome: interview?.outcome ?? "",
      status: interview?.status ?? "pending",
    });
  }

  function handleSave() {
    if (!editEmployee || !user) return;
    const cycle = cycles.find(c => c.id === selectedCycle);
    upsertMutation.mutate({
      cycleId: selectedCycle,
      employeeUserId: editEmployee.id,
      managerUserId: user.id,
      year: cycle?.year ?? new Date().getFullYear(),
      scheduledAt: form.scheduledAt || null,
      notes: form.notes || null,
      outcome: form.outcome || null,
      status: form.status,
    });
  }

  const getInterview = (memberId: string): Interview | undefined =>
    interviews.find(i => i.employeeUserId === memberId);

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          context="VALUTAZIONI"
          title="Colloqui di Feedback"
          description="Gestisci e firma i colloqui con il tuo team"
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

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessun membro del team trovato
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data schedulata</TableHead>
                  <TableHead>Firma Manager</TableHead>
                  <TableHead>Firma Dipendente</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map(member => {
                  const interview = getInterview(member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </TableCell>
                      <TableCell>
                        {interview ? (
                          <Badge variant={interview.status === "completed" ? "default" : interview.status === "scheduled" ? "secondary" : "outline"}>
                            {interview.status === "completed" ? "Completato" : interview.status === "scheduled" ? "Schedulato" : "In attesa"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Non avviato</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {interview?.scheduledAt
                          ? new Date(interview.scheduledAt * 1000).toLocaleDateString("it-IT")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {interview?.managerSignedAt ? (
                          <Badge variant="default">Firmato</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => signMutation.mutate(member.id)}
                            disabled={signMutation.isPending || !interview}
                          >
                            <FileSignature className="h-3.5 w-3.5 mr-1" /> Firma
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={interview?.employeeSignedAt ? "default" : "outline"}>
                          {interview?.employeeSignedAt ? "Firmato" : "In attesa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editEmployee} onOpenChange={open => !open && setEditEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Colloquio — {editEmployee?.firstName} {editEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="scheduled">Schedulato</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data colloquio</Label>
              <Input
                type="date"
                value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Note (visibili al dipendente)</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Note sul colloquio..."
              />
            </div>
            <div className="space-y-2">
              <Label>Esito</Label>
              <Textarea
                value={form.outcome}
                onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
                rows={3}
                placeholder="Esito e conclusioni del colloquio..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmployee(null)}>Annulla</Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
