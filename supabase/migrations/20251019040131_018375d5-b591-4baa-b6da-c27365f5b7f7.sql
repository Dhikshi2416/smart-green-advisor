-- Add is_on field to user_devices table
ALTER TABLE public.user_devices
ADD COLUMN is_on boolean NOT NULL DEFAULT true;

-- Create device consumption history table
CREATE TABLE public.device_consumption_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES public.user_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  consumption numeric NOT NULL DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_consumption_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own consumption history"
ON public.device_consumption_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumption history"
ON public.device_consumption_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_device_consumption_history_device_id ON public.device_consumption_history(device_id);
CREATE INDEX idx_device_consumption_history_recorded_at ON public.device_consumption_history(recorded_at);

-- Enable realtime for device updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_devices;