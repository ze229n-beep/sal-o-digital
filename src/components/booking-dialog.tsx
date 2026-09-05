import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BookableService = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function generateSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

export function BookingDialog({
  service,
  open,
  onOpenChange,
}: {
  service: BookableService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");

  const { data: taken = [] } = useQuery({
    queryKey: ["taken-slots", date],
    enabled: open && !!date,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("start_time")
        .eq("date", date)
        .neq("status", "cancelado");
      return (data ?? []).map((r) => String(r.start_time).slice(0, 5));
    },
  });

  const today = toDateInputValue(new Date());
  const isToday = date === today;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const available = useMemo(
    () =>
      ALL_SLOTS.filter((s) => {
        if (taken.includes(s)) return false;
        if (isToday) {
          const [h, m] = s.split(":").map(Number);
          if (h * 60 + m <= nowMinutes) return false;
        }
        return true;
      }),
    [taken, isToday, nowMinutes],
  );

  const canSubmit =
    !!service && !!slot && name.trim().length >= 2 && phone.trim().length >= 8 && state !== "saving";

  function reset() {
    setSlot(null);
    setName("");
    setPhone("");
    setState("idle");
  }

  async function submit() {
    if (!canSubmit || !service || !slot) return;
    setState("saving");
    try {
      const { error } = await supabase.from("appointments").insert({
        service_id: service.id,
        service_name: service.name,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        date,
        start_time: slot,
        duration_minutes: service.duration_minutes,
        status: "pendente",
      });
      if (error) throw error;
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" /> Agendar horário
          </DialogTitle>
          <DialogDescription>
            {service
              ? `${service.name} · ${brl(service.price)} · ${service.duration_minutes} min`
              : "Escolha a data e o horário."}
          </DialogDescription>
        </DialogHeader>

        {state === "success" ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <p className="text-lg font-semibold">Agendamento enviado!</p>
            <p className="text-sm text-muted-foreground">
              Recebemos seu pedido para {date.split("-").reverse().join("/")} às {slot}. A barbearia
              confirmará seu horário.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="b-data">Data</Label>
              <Input
                id="b-data"
                type="date"
                min={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário</Label>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário livre nesta data. Escolha outro dia.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {available.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={slot === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSlot(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b-nome">Seu nome</Label>
                <Input
                  id="b-nome"
                  value={name}
                  placeholder="Nome completo"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-fone">WhatsApp / telefone</Label>
                <Input
                  id="b-fone"
                  value={phone}
                  placeholder="(11) 99999-0000"
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {state === "error" ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                ⚠ Não foi possível agendar. Tente novamente.
              </p>
            ) : null}

            <Button className="w-full" disabled={!canSubmit} onClick={submit}>
              {state === "saving" ? "Enviando..." : "Confirmar agendamento"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
