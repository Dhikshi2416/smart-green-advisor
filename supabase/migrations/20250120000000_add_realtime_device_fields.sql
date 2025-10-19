-- Add real-time device fields to user_devices table
ALTER TABLE public.user_devices 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS mac_address text,
ADD COLUMN IF NOT EXISTS bluetooth_id text,
ADD COLUMN IF NOT EXISTS capabilities text[],
ADD COLUMN IF NOT EXISTS temperature numeric,
ADD COLUMN IF NOT EXISTS mode text,
ADD COLUMN IF NOT EXISTS fan_speed integer,
ADD COLUMN IF NOT EXISTS brightness integer,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS max_consumption numeric DEFAULT 5.0;

-- Create solar_panels table
CREATE TABLE IF NOT EXISTS public.solar_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_connected boolean NOT NULL DEFAULT false,
  generation numeric NOT NULL DEFAULT 0,
  efficiency numeric NOT NULL DEFAULT 0,
  temperature numeric,
  voltage numeric,
  current numeric,
  power numeric,
  status text NOT NULL DEFAULT 'offline',
  location text,
  tilt numeric,
  azimuth numeric,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create solar_inverters table
CREATE TABLE IF NOT EXISTS public.solar_inverters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_connected boolean NOT NULL DEFAULT false,
  input_power numeric NOT NULL DEFAULT 0,
  output_power numeric NOT NULL DEFAULT 0,
  efficiency numeric NOT NULL DEFAULT 0,
  temperature numeric,
  voltage numeric,
  current numeric,
  frequency numeric,
  status text NOT NULL DEFAULT 'offline',
  model text,
  brand text,
  firmware_version text,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create solar_batteries table
CREATE TABLE IF NOT EXISTS public.solar_batteries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_connected boolean NOT NULL DEFAULT false,
  charge_level numeric NOT NULL DEFAULT 0,
  capacity numeric NOT NULL DEFAULT 0,
  voltage numeric,
  current numeric,
  power numeric,
  temperature numeric,
  cycles numeric NOT NULL DEFAULT 0,
  health numeric NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'idle',
  model text,
  brand text,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.solar_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_inverters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_batteries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for solar_panels
CREATE POLICY "Users can view their own solar panels"
  ON public.solar_panels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own solar panels"
  ON public.solar_panels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solar panels"
  ON public.solar_panels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solar panels"
  ON public.solar_panels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for solar_inverters
CREATE POLICY "Users can view their own solar inverters"
  ON public.solar_inverters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own solar inverters"
  ON public.solar_inverters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solar inverters"
  ON public.solar_inverters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solar inverters"
  ON public.solar_inverters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for solar_batteries
CREATE POLICY "Users can view their own solar batteries"
  ON public.solar_batteries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own solar batteries"
  ON public.solar_batteries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solar batteries"
  ON public.solar_batteries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solar batteries"
  ON public.solar_batteries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update existing user_devices policies to include new fields
DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.user_devices;

CREATE POLICY "Users can view their own devices"
  ON public.user_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.user_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON public.user_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
