import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SaveFeedback, type SaveState } from "@/components/save-bar";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";

export const Route = createFileRoute("/_authenticated/painel/seguranca")({
  component: SegurancaPage,
});

function SegurancaPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  const dirty = current !== "" || next !== "" || confirm !== "";
  const saving = state === "saving";

  function requestChange() {
    setState("idle");
    if (next.length < 6) {
      setValidation("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      setValidation("A confirmação não confere com a nova senha.");
      return;
    }
    if (!current) {
      setValidation("Informe sua senha atual.");
      return;
    }
    setValidation(null);
    setConfirmOpen(true);
  }

  async function applyChange() {
    if (saving) return;
    setConfirmOpen(false);
    setState("saving");
    try {
      const { error } = await supabase.auth.updateUser({
        password: next,
        // @ts-expect-error current_password é exigido pelo backend em troca autenticada
        current_password: current,
      });
      if (error) throw error;
      setCurrent("");
      setNext("");
      setConfirm("");
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-6">
      <UnsavedChangesGuard dirty={dirty && !saving} />

      <div>
        <h1 className="font-display text-3xl tracking-wide">Segurança</h1>
        <p className="text-sm text-muted-foreground">
          Altere a senha de acesso ao painel. Nada é alterado até você confirmar.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Use uma senha com no mínimo 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atual">Senha atual</Label>
            <Input
              id="atual"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirma">Confirmar nova senha</Label>
            <Input
              id="confirma"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {validation ? <p className="text-sm text-destructive">⚠ {validation}</p> : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" onClick={requestChange} disabled={saving || !dirty}>
              {saving ? "Salvando..." : "ALTERAR SENHA"}
            </Button>
            <SaveFeedback state={state} />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de senha</AlertDialogTitle>
            <AlertDialogDescription>
              Sua senha de acesso será substituída. Deseja concluir a alteração?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={applyChange} disabled={saving}>
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
