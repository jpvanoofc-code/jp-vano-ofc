
-- Drop the overly permissive policy
DROP POLICY "Anyone can create orders" ON public.orders;

-- Create a more restrictive policy - anyone authenticated can create orders with their own user_id
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
