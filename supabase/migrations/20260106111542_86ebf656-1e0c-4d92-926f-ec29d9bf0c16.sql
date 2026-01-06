
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''), 
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'username', '')
  );
  
  -- Assign role based on metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'employee')
  );
  
  RETURN new;
END;
$$;
