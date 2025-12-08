-- Tabela de EPIs (Equipamentos de Proteção Individual)
CREATE TABLE public.epis (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para EPIs
CREATE POLICY "Allow public read access to epis" ON public.epis FOR SELECT USING (true);
CREATE POLICY "Allow public insert to epis" ON public.epis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to epis" ON public.epis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from epis" ON public.epis FOR DELETE USING (true);

-- Tabela de relacionamento muitos-para-muitos entre ordens de serviço e técnicos
CREATE TABLE public.service_order_technicians (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(service_order_id, technician_id)
);

-- Habilitar RLS
ALTER TABLE public.service_order_technicians ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow public read access to service_order_technicians" ON public.service_order_technicians FOR SELECT USING (true);
CREATE POLICY "Allow public insert to service_order_technicians" ON public.service_order_technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete from service_order_technicians" ON public.service_order_technicians FOR DELETE USING (true);

-- Tabela de relacionamento muitos-para-muitos entre ordens de serviço e EPIs
CREATE TABLE public.service_order_epis (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    epi_id uuid NOT NULL REFERENCES public.epis(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(service_order_id, epi_id)
);

-- Habilitar RLS
ALTER TABLE public.service_order_epis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow public read access to service_order_epis" ON public.service_order_epis FOR SELECT USING (true);
CREATE POLICY "Allow public insert to service_order_epis" ON public.service_order_epis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete from service_order_epis" ON public.service_order_epis FOR DELETE USING (true);

-- Inserir EPIs comuns
INSERT INTO public.epis (name, description) VALUES
('Capacete', 'Capacete de proteção para a cabeça'),
('Luva de Segurança', 'Luvas para proteção das mãos'),
('Óculos de Proteção', 'Proteção para os olhos'),
('Protetor Auricular', 'Proteção auditiva'),
('Bota de Segurança', 'Calçado de proteção'),
('Máscara Respiratória', 'Proteção respiratória'),
('Cinto de Segurança', 'Proteção contra quedas'),
('Avental de Proteção', 'Proteção do corpo'),
('Luva Isolante', 'Luva para trabalho elétrico'),
('Protetor Facial', 'Proteção facial completa');