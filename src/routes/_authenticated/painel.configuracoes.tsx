import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveBar, type SaveState } from "@/components/save-bar";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
  component: ConfiguracoesPage,
});

type Settings = {
  id: string;
  name: string;
  whatsapp: string;
  instagram: string;
  address: string;
  hours: string;
  about: string;
};

const empty: Omit<Settings, "id"> = {
  name: "",
  whatsapp: "",
  instagram: "",
  address: "",
  hours: "",
  about: "",
};

function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Omit<Settings, "id"> | null>(null);
  const [state, setState] = useState<SaveState>("idle");

  const { data, isLoading } = useQuery({
    queryKey: ["shop_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Settings | null) ?? null;
    },
  });

  const original = useMemo<Omit<Settings, "id">>(() => {
    if (!data) return empty;
    const { id: _id, ...rest } = data;
    return {
      name: rest.name ?? "",
      whatsapp: rest.whatsapp ?? "",
      instagram: rest.instagram ?? "",
      address: rest.address ?? "",
      hours: rest.hours ?? "",
      about: rest.about ?? "",
    };
  }, [data]);

  const value = draft ?? original;
  const dirty = JSON.stringify(value) !== JSON.stringify(original);
  const saving = state === "saving";

  function update(patch: Partial<Omit<Settings, "id">>) {
    setState("idle");
    setDraft({ ...value, ...patch });
  }

  async function save() {
    if (saving || !dirty) return;
    setState("saving");
    try {
      if (data?.id) {
        const { error } = await supabase.from("shop_settings").update(value).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shop_settings").insert(value);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
      setDraft(null);
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-6">
      <UnsavedChangesGuard dirty={dirty} />

      <div>
        <h1 className="font-display text-3xl tracking-wide">Configurações da barbearia</h1>
        <p className="text-sm text-muted-foreground">
          As alterações ficam apenas nesta tela até você clicar em salvar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados públicos</CardTitle>
          <CardDescription>Informações exibidas para os clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da barbearia</Label>
                  <Input
                    id="nome"
                    value={value.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whats">WhatsApp</Label>
                  <Input
                    id="whats"
                    value={value.whatsapp}
                    onChange={(e) => update({ whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insta">Instagram</Label>
                  <Input
                    id="insta"
                    value={value.instagram}
                    onChange={(e) => update({ instagram: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Endereço</Label>
                  <Input
                    id="end"
                    value={value.address}
                    onChange={(e) => update({ address: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarios">Horários de funcionamento</Label>
                <Textarea
                  id="horarios"
                  rows={4}
                  value={value.hours}
                  onChange={(e) => update({ hours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobre">Texto da barbearia</Label>
                <Textarea
                  id="sobre"
                  rows={5}
                  value={value.about}
                  onChange={(e) => update({ about: e.target.value })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 rounded-lg border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
        <SaveBar
          dirty={dirty}
          state={state}
          onSave={save}
          onDiscard={() => {
            setDraft(null);
            setState("idle");
          }}
        />
      </div>
    </div>
  );
}
