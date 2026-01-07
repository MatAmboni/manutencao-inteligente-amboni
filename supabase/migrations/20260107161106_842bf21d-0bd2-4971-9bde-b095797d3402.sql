-- Create a function to automatically create a technician when an employee is created
CREATE OR REPLACE FUNCTION public.handle_new_employee_technician()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Only create technician if the role is 'employee'
  IF NEW.role = 'employee' THEN
    -- Get the user's full name from profiles
    SELECT full_name INTO user_full_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Check if technician already exists for this user
    IF NOT EXISTS (SELECT 1 FROM public.technicians WHERE user_id = NEW.user_id) THEN
      INSERT INTO public.technicians (user_id, name)
      VALUES (NEW.user_id, COALESCE(user_full_name, 'Técnico'));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS on_employee_role_created ON public.user_roles;
CREATE TRIGGER on_employee_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_employee_technician();

-- Sync existing employees that don't have technician records
INSERT INTO public.technicians (user_id, name)
SELECT ur.user_id, COALESCE(p.full_name, 'Técnico')
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'employee'
AND NOT EXISTS (SELECT 1 FROM public.technicians t WHERE t.user_id = ur.user_id);