
DROP POLICY IF EXISTS "service_orders_update_policy" ON public.service_orders;

CREATE POLICY "service_orders_update_policy"
ON public.service_orders
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    (status = 'Pendente'::text) AND (auth.uid() IS NOT NULL)
  )
  OR (
    (status = 'Em Andamento'::text) AND (EXISTS (
      SELECT 1 FROM service_order_technicians sot
      JOIN technicians t ON sot.technician_id = t.id
      WHERE sot.service_order_id = service_orders.id AND t.user_id = auth.uid()
    ))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL)
);
