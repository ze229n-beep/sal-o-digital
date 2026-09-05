CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Geral',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Serviços ativos são públicos" ON public.services FOR SELECT TO anon USING (active = true);
CREATE POLICY "Autenticados leem serviços" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados criam serviços" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados editam serviços" ON public.services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados removem serviços" ON public.services FOR DELETE TO authenticated USING (true);

CREATE TABLE public.shop_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Configurações são públicas" ON public.shop_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Autenticados leem configurações" ON public.shop_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados criam configurações" ON public.shop_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados editam configurações" ON public.shop_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.services (name, price, duration_minutes, description, category, active) VALUES
('Corte Clássico', 45.00, 30, 'Corte na tesoura e máquina com acabamento na navalha.', 'Cabelo', true),
('Corte Degradê', 55.00, 40, 'Degradê alto, médio ou baixo com finalização detalhada.', 'Cabelo', true),
('Barba Terapia', 40.00, 30, 'Toalha quente, óleo essencial e navalha.', 'Barba', true),
('Combo Corte + Barba', 85.00, 60, 'O pacote completo da casa.', 'Combos', true),
('Pezinho', 20.00, 15, 'Acabamento rápido de nuca e costeletas.', 'Cabelo', true),
('Pigmentação de Barba', 50.00, 35, 'Preenchimento de falhas com pigmento próprio.', 'Barba', false);

INSERT INTO public.shop_settings (name, whatsapp, instagram, address, hours, about) VALUES
('Barbearia Navalha de Ouro', '(11) 98888-7777', '@navalhadeouro', 'Rua Augusta, 1200 - Consolação, São Paulo - SP', E'Segunda a Sexta: 09h às 20h\nSábado: 09h às 18h\nDomingo: Fechado', 'Tradição de barbearia clássica com acabamento moderno. Desde 2014 cuidando do estilo dos nossos clientes.');