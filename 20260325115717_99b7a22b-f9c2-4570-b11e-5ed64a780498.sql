
-- Add is_blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile (for blocking)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
