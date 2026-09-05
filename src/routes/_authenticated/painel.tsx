import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Scissors, Settings, ShieldCheck, LogOut, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelLayout,
});

const links = [
  { to: "/painel/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { to: "/painel/servicos", label: "Serviços", icon: Scissors },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings },
  { to: "/painel/seguranca", label: "Segurança", icon: ShieldCheck },
] as const;

function PainelLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="font-display text-lg tracking-[0.2em] text-primary uppercase">
            Navalha de Ouro
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="size-4" />
              Sair
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
