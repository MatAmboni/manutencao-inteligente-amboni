-- Drop existing policies
DROP POLICY IF EXISTS "service_orders_select_policy" ON public.service_orders;
DROP POLICY IF EXISTS "service_orders_update_policy" ON public.service_orders;

-- New SELECT policy: 
-- Admins can see all orders
-- Employees can see: ALL pending orders + orders where they're assigned
CREATE POLICY "service_orders_select_policy" 
ON public.service_orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  status = 'Pendente'
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

-- New UPDATE policy:
-- Admins can update all orders
-- Authenticated users can update pending orders (to start them)
-- Assigned technicians can update in-progress orders (to complete them)
CREATE POLICY "service_orders_update_policy" 
ON public.service_orders 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (status = 'Pendente' AND auth.uid() IS NOT NULL)
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