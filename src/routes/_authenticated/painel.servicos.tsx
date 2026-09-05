import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { SaveBar, type SaveState } from "@/components/save-bar";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  component: ServicosPage,
});

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
  category: string;
  active: boolean;
};

type Draft = Omit<Service, "id">;

const emptyDraft: Draft = {
  name: "",
  price: 0,
  duration_minutes: 30,
  description: "",
  category: "Cabelo",
  active: true,
};

const categories = ["Cabelo", "Barba", "Combos", "Estética", "Geral"];

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function ServicosPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [baseline, setBaseline] = useState<Draft>(emptyDraft);
  const [state, setState] = useState<SaveState>("idle");
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const open = creating || editingId !== null;
  const dirty = open && JSON.stringify(draft) !== JSON.stringify(baseline);
  const saving = state === "saving";

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const service of services) {
      const list = map.get(service.category) ?? [];
      list.push(service);
      map.set(service.category, list);
    }
    return [...map.entries()];
  }, [services]);

  function startCreate() {
    setState("idle");
    setDraft(emptyDraft);
    setBaseline(emptyDraft);
    setEditingId(null);
    setCreating(true);
  }

  function startEdit(service: Service) {
    const { id: _id, ...rest } = service;
    setState("idle");
    setDraft(rest);
    setBaseline(rest);
    setCreating(false);
    setEditingId(service.id);
  }

  function closeForm(force = false) {
    if (dirty && !force) return;
    setCreating(false);
    setEditingId(null);
    setState("idle");
  }

  async function save() {
    if (saving || !dirty) return;
    setState("saving");
    try {
      if (editingId) {
        const { error } = await supabase.from("services").update(draft).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(draft);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      setBaseline(draft);
      setState("success");
    } catch {
      setState("error");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await supabase.from("services").delete().eq("id", pendingDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <UnsavedChangesGuard dirty={dirty} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e edite os serviços da barbearia. Nada é salvo automaticamente.
          </p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="size-4" /> Novo serviço
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando serviços...</p> : null}

      <div className="space-y-8">
        {grouped.map(([category, list]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {category}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((service) => (
                <Card key={service.id} className="border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <Badge variant={service.active ? "default" : "secondary"}>
                        {service.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-xl text-primary">{brl(service.price)}</span>
                      <span className="text-sm text-muted-foreground">
                        {service.duration_minutes} min
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => startEdit(service)}>
                        <Pencil className="size-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(service)}
                      >
                        <Trash2 className="size-3.5" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              As alterações só são gravadas ao clicar em salvar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-nome">Nome</Label>
              <Input
                id="s-nome"
                value={draft.name}
                onChange={(e) => {
                  setState("idle");
                  setDraft({ ...draft, name: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-preco">Preço (R$)</Label>
                <Input
                  id="s-preco"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => {
                    setState("idle");
                    setDraft({ ...draft, price: Number(e.target.value) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-dur">Duração (minutos)</Label>
                <Input
                  id="s-dur"
                  type="number"
                  min={5}
                  step={5}
                  value={draft.duration_minutes}
                  onChange={(e) => {
                    setState("idle");
                    setDraft({ ...draft, duration_minutes: Number(e.target.value) });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-cat">Categoria / família</Label>
              <select
                id="s-cat"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={draft.category}
                onChange={(e) => {
                  setState("idle");
                  setDraft({ ...draft, category: e.target.value });
                }}
              >
                {[...new Set([...categories, draft.category])].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição</Label>
              <Textarea
                id="s-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => {
                  setState("idle");
                  setDraft({ ...draft, description: e.target.value });
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Serviço ativo</p>
                <p className="text-xs text-muted-foreground">Inativos não aparecem para clientes.</p>
              </div>
              <Switch
                checked={draft.active}
                onCheckedChange={(checked) => {
                  setState("idle");
                  setDraft({ ...draft, active: checked });
                }}
              />
            </div>

            <SaveBar dirty={dirty} state={state} onSave={save} onDiscard={() => setDraft(baseline)} />

            {!dirty ? (
              <Button variant="outline" className="w-full" onClick={() => closeForm(true)}>
                Fechar
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
            <AlertDialogDescription>
              O serviço “{pendingDelete?.name}” será removido definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
