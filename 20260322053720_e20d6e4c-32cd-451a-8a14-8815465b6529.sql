
-- Duration type enum
CREATE TYPE public.subscription_duration AS ENUM ('7_days', '1_month', '6_months', '12_months');

-- Activation codes table
CREATE TABLE public.activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  duration subscription_duration NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can check codes (via edge function with service role)
-- No direct client access needed

-- Add subscription expiry to profiles
ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;

-- Insert sample codes
INSERT INTO public.activation_codes (code, duration) VALUES
  ('TRIAL7DAYS', '7_days'),
  ('MONTH2025A', '1_month'),
  ('MONTH2025B', '1_month'),
  ('HALF2025XX', '6_months'),
  ('YEAR2025VIP', '12_months'),
  ('ABC123XYZ', '7_days'),
  ('MNO456JKL', '1_month');
