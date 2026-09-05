import { Button } from "@/components/ui/button";

export type SaveState = "idle" | "saving" | "success" | "error";

export function SaveFeedback({ state }: { state: SaveState }) {
  if (state === "success") {
    return (
      <span className="text-sm font-medium text-emerald-500">✓ Alterações salvas com sucesso!</span>
    );
  }
  if (state === "error") {
    return (
      <span className="text-sm font-medium text-destructive">
        ⚠ Não foi possível salvar. Tente novamente.
      </span>
    );
  }
  return null;
}

export function SaveBar({
  dirty,
  state,
  onSave,
  onDiscard,
  className,
}: {
  dirty: boolean;
  state: SaveState;
  onSave: () => void;
  onDiscard?: () => void;
  className?: string;
}) {
  const saving = state === "saving";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      {dirty ? (
        <>
          <Button type="button" onClick={onSave} disabled={saving || !dirty}>
            {saving ? "Salvando..." : "💾 SALVAR ALTERAÇÕES"}
          </Button>
          {onDiscard ? (
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={saving}>
              Descartar
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">Você tem alterações não salvas</span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">Nenhuma alteração pendente</span>
      )}
      <SaveFeedback state={state} />
    </div>
  );
}
