import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, CheckCheck, Trash2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/painel/agendamentos")({
  component: AgendamentosPage,
});

type Appointment = {
  id: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
};

const statusMeta: Record<Appointment["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  concluido: { label: "Concluído", variant: "secondary" },
};

const filters = [
  { key: "proximos", label: "Próximos" },
  { key: "pendente", label: "Pendentes" },
  { key: "todos", label: "Todos" },
] as const;

function formatDate(d: string) {
  return d.split("-").reverse().join("/");
}

function AgendamentosPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("proximos");
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => {
    if (filter === "pendente") return appointments.filter((a) => a.status === "pendente");
    if (filter === "proximos")
      return appointments.filter(
        (a) => a.date >= today && (a.status === "pendente" || a.status === "confirmado"),
      );
    return appointments;
  }, [appointments, filter, today]);

  async function setStatus(id: string, status: Appointment["status"]) {
    if (busyId) return;
    setBusyId(id);
    try {
      await supabase.from("appointments").update({ status }).eq("id", id);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || busyId) return;
    setBusyId(pendingDelete.id);
    try {
      await supabase.from("appointments").delete().eq("id", pendingDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">
            Confirme, cancele ou conclua os horários marcados pelos clientes.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border/60 p-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando agendamentos...</p> : null}

      {!isLoading && visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento nesta visão.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => (
          <Card key={a.id} className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{a.customer_name}</CardTitle>
                <Badge variant={statusMeta[a.status].variant}>{statusMeta[a.status].label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(a.date)} às {String(a.start_time).slice(0, 5)} · {a.service_name} (
                {a.duration_minutes} min)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5" /> {a.customer_phone}
              </p>
              <div className="flex flex-wrap gap-2">
                {a.status === "pendente" ? (
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, "confirmado")}
                  >
                    <Check className="size-3.5" /> Confirmar
                  </Button>
                ) : null}
                {a.status === "confirmado" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, "concluido")}
                  >
                    <CheckCheck className="size-3.5" /> Concluir
                  </Button>
                ) : null}
                {a.status !== "cancelado" && a.status !== "concluido" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, "cancelado")}
                  >
                    <X className="size-3.5" /> Cancelar
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                  disabled={busyId === a.id}
                  onClick={() => setPendingDelete(a)}
                >
                  <Trash2 className="size-3.5" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento de “{pendingDelete?.customer_name}” será removido definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
