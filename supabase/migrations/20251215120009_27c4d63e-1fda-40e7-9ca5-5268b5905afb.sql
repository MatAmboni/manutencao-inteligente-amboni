-- Create risks table linked to equipment
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Elétrico', 'Mecânico')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Baixo', 'Médio', 'Alto', 'Crítico')),
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Monitorando', 'Resolvido')),
  identified_at DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to risks" 
ON public.risks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to risks" 
ON public.risks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to risks" 
ON public.risks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete from risks" 
ON public.risks 
FOR DELETE 
USING (true);