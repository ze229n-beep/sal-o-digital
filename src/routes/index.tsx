import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, Clock, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Navalha de Ouro | Cortes e barba em São Paulo" },
      {
        name: "description",
        content:
          "Barbearia clássica com acabamento moderno: cortes, barba terapia e combos. Veja preços, horários e fale no WhatsApp.",
      },
      { property: "og:title", content: "Barbearia Navalha de Ouro" },
      {
        property: "og:description",
        content: "Cortes, barba terapia e combos com hora marcada. Confira preços e horários.",
      },
    ],
  }),
  component: Home,
});

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
  category: string;
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function Home() {
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("price", { ascending: true });
      return (data ?? []) as Service[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <span className="font-display text-lg uppercase tracking-[0.25em] text-primary">
            {settings?.name ?? "Navalha de Ouro"}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Painel administrativo</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Barbearia</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight tracking-wide md:text-6xl">
            {settings?.name ?? "Barbearia Navalha de Ouro"}
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {settings?.about ??
              "Tradição de barbearia clássica com acabamento moderno."}
          </p>
        </section>

        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-4">
            <Info icon={<Phone className="size-4" />} label="WhatsApp" value={settings?.whatsapp} />
            <Info icon={<Instagram className="size-4" />} label="Instagram" value={settings?.instagram} />
            <Info icon={<MapPin className="size-4" />} label="Endereço" value={settings?.address} />
            <Info icon={<Clock className="size-4" />} label="Horários" value={settings?.hours} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl tracking-wide">Serviços</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-lg border border-border/60 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-primary">{service.category}</p>
                <h3 className="mt-2 text-lg font-semibold">{service.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                <p className="mt-4 font-display text-xl text-primary">
                  {brl(service.price)}{" "}
                  <span className="text-sm text-muted-foreground">
                    · {service.duration_minutes} min
                  </span>
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {settings?.name ?? "Navalha de Ouro"}
      </footer>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
        {icon} {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{value ?? "—"}</p>
    </div>
  );
}
