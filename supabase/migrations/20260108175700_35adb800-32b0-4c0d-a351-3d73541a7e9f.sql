-- Create updated_at function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create work_entry_permits table (PET - Permissão de Entrada e Trabalho)
CREATE TABLE public.work_entry_permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Identificação
  company_name TEXT NOT NULL,
  confined_space_location TEXT NOT NULL,
  confined_space_number TEXT,
  issue_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  work_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo',
  
  -- Pessoal
  authorized_workers TEXT[] NOT NULL DEFAULT '{}',
  guard TEXT NOT NULL,
  rescue_team TEXT NOT NULL,
  entry_supervisor TEXT NOT NULL,
  test_supervisor TEXT,
  
  -- Procedimentos antes da entrada
  isolation_completed BOOLEAN,
  
  -- Teste inicial da atmosfera
  initial_test_time TIME,
  initial_oxygen_percent NUMERIC(5,2),
  initial_flammable_percent NUMERIC(5,2),
  initial_toxic_ppm NUMERIC(10,2),
  initial_dust_mg NUMERIC(10,2),
  
  -- Checklist de procedimentos
  lockout_tagout TEXT DEFAULT 'N/A',
  purge_wash TEXT DEFAULT 'N/A',
  ventilation TEXT DEFAULT 'N/A',
  ventilation_equipment TEXT,
  ventilation_time TEXT,
  
  -- Teste após ventilação
  post_ventilation_test_time TIME,
  post_oxygen_percent NUMERIC(5,2),
  post_oxygen_ok TEXT DEFAULT 'N/A',
  post_flammable_percent NUMERIC(5,2),
  post_flammable_ok TEXT DEFAULT 'N/A',
  post_toxic_ppm NUMERIC(10,2),
  post_dust_mg NUMERIC(10,2),
  
  -- Outros procedimentos
  general_lighting TEXT DEFAULT 'N/A',
  communication_procedure TEXT DEFAULT 'N/A',
  rescue_procedures TEXT DEFAULT 'N/A',
  vertical_movement TEXT DEFAULT 'N/A',
  training_current TEXT DEFAULT 'N/A',
  continuous_monitoring TEXT DEFAULT 'N/A',
  hot_work_permit TEXT DEFAULT 'N/A',
  
  -- Equipamentos (JSONB para flexibilidade)
  equipment_checklist JSONB DEFAULT '{
    "flashlights": "N/A",
    "protective_clothing": "N/A",
    "fire_extinguishers": "N/A",
    "helmets_boots_gloves": "N/A",
    "respiratory_protection": "N/A",
    "safety_belt_lifeline_workers": "N/A",
    "safety_belt_lifeline_rescue": "N/A",
    "ladder": "N/A",
    "vertical_movement_equipment": "N/A",
    "electronic_communication": "N/A",
    "rescue_respiratory_equipment": "N/A",
    "approved_electrical_equipment": "N/A"
  }'::jsonb,
  
  -- Contatos de emergência
  ambulance_contact TEXT,
  fire_department_contact TEXT,
  security_contact TEXT,
  
  -- Notas adicionais
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.work_entry_permits ENABLE ROW LEVEL SECURITY;

-- Only admins can manage work entry permits
CREATE POLICY "Admins can manage work_entry_permits"
ON public.work_entry_permits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view permits
CREATE POLICY "Authenticated users can view work_entry_permits"
ON public.work_entry_permits
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_work_entry_permits_updated_at
BEFORE UPDATE ON public.work_entry_permits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();