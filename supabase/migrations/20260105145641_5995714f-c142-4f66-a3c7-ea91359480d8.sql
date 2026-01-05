-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add user_id column to technicians table to link technicians to auth users
ALTER TABLE public.technicians 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create security definer function to check user role (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's technician_id
CREATE OR REPLACE FUNCTION public.get_user_technician_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.technicians WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger function to create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'employee');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update service_orders policies for role-based access
DROP POLICY IF EXISTS "Allow public read access to service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Allow public insert to service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Allow public update to service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Allow public delete from service_orders" ON public.service_orders;

-- Admins can do everything, employees can only see assigned pending/in-progress orders
CREATE POLICY "service_orders_select_policy"
ON public.service_orders FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    status IN ('Pendente', 'Em Andamento')
    AND EXISTS (
      SELECT 1 FROM public.service_order_technicians sot
      JOIN public.technicians t ON sot.technician_id = t.id
      WHERE sot.service_order_id = service_orders.id
      AND t.user_id = auth.uid()
    )
  )
);

-- Only admins can insert orders
CREATE POLICY "service_orders_insert_policy"
ON public.service_orders FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update anything, employees can only update status of their assigned orders
CREATE POLICY "service_orders_update_policy"
ON public.service_orders FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    status IN ('Pendente', 'Em Andamento')
    AND EXISTS (
      SELECT 1 FROM public.service_order_technicians sot
      JOIN public.technicians t ON sot.technician_id = t.id
      WHERE sot.service_order_id = service_orders.id
      AND t.user_id = auth.uid()
    )
  )
);

-- Only admins can delete orders
CREATE POLICY "service_orders_delete_policy"
ON public.service_orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));