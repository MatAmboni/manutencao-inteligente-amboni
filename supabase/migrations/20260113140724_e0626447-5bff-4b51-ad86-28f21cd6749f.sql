-- Add sector column to technicians table
ALTER TABLE public.technicians 
ADD COLUMN sector text;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "service_orders_select_policy" ON public.service_orders;

-- Create function to get technician sector
CREATE OR REPLACE FUNCTION public.get_user_sector(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sector
  FROM public.technicians
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- New SELECT policy with sector filter for employees:
-- Admins can see all orders
-- Employees can see: pending orders from their sector + in-progress orders where they're assigned
CREATE POLICY "service_orders_select_policy" 
ON public.service_orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
    status = 'Pendente'
    AND (
      get_user_sector(auth.uid()) IS NULL 
      OR sector = get_user_sector(auth.uid())
    )
  )
  OR 
  (
    status = 'Em Andamento' 
    AND EXISTS (
      SELECT 1 FROM service_order_technicians sot
      JOIN technicians t ON sot.technician_id = t.id
      WHERE sot.service_order_id = service_orders.id 
      AND t.user_id = auth.uid()
    )
  )
);