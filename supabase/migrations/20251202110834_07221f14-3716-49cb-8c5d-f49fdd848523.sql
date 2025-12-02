-- Create equipment table
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Elétrico', 'Mecânico')),
  status TEXT NOT NULL CHECK (status IN ('Operacional', 'Manutenção', 'Inativo')),
  location TEXT NOT NULL,
  last_maintenance DATE NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service_orders table
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída')),
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
  sector TEXT NOT NULL CHECK (sector IN ('Elétrico', 'Mecânico')),
  execution_team TEXT NOT NULL CHECK (execution_team IN ('Interna', 'Externa')),
  request_date DATE NOT NULL,
  suggested_deadline DATE NOT NULL,
  requester TEXT NOT NULL,
  assigned_to TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create requesters table
CREATE TABLE public.requesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create technicians table
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Allow public read access to equipment"
  ON public.equipment FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to equipment"
  ON public.equipment FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to equipment"
  ON public.equipment FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete from equipment"
  ON public.equipment FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to service_orders"
  ON public.service_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to service_orders"
  ON public.service_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to service_orders"
  ON public.service_orders FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete from service_orders"
  ON public.service_orders FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to requesters"
  ON public.requesters FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to requesters"
  ON public.requesters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to technicians"
  ON public.technicians FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to technicians"
  ON public.technicians FOR INSERT
  WITH CHECK (true);

-- Insert sample data
INSERT INTO public.equipment (name, type, status, location, last_maintenance, manufacturer, model, serial_number, install_date) VALUES
  ('Compressor 01', 'Mecânico', 'Manutenção', 'Setor A - Linha 1', '2024-01-10', 'Atlas Copco', 'GA 75', 'SN-2023-001', '2023-06-15'),
  ('Motor Elétrico 03', 'Elétrico', 'Operacional', 'Setor B - Linha 2', '2023-12-15', 'WEG', 'W22', 'SN-2022-045', '2022-03-20'),
  ('Painel de Controle', 'Elétrico', 'Operacional', 'Sala de Controle', '2024-01-05', 'Schneider', 'TeSys', 'SN-2023-089', '2023-09-10'),
  ('Válvula de Pressão 5', 'Mecânico', 'Operacional', 'Setor C - Linha 3', '2024-01-08', 'Parker', 'VP-500', 'SN-2023-112', '2023-11-05'),
  ('Transformador Principal', 'Elétrico', 'Operacional', 'Subestação', '2024-01-03', 'ABB', 'DTG 500', 'SN-2021-003', '2021-08-12'),
  ('Bomba Hidráulica 02', 'Mecânico', 'Inativo', 'Setor A - Linha 1', '2023-11-20', 'Grundfos', 'CR 64', 'SN-2022-078', '2022-05-18');

INSERT INTO public.technicians (name) VALUES
  ('João Silva'),
  ('Maria Santos'),
  ('Pedro Oliveira'),
  ('Ana Costa'),
  ('Carlos Ferreira');

INSERT INTO public.requesters (name) VALUES
  ('Roberto Machado'),
  ('Fernanda Lima'),
  ('Carlos Souza');