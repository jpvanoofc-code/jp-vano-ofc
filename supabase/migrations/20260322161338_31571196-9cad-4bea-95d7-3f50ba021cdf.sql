
-- Suppliers table (Mercado Livre, Shopee, etc.)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'mercadolivre' or 'shopee'
  platform_user_id TEXT,
  platform_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
  profit_margin_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  profit_margin_value NUMERIC NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Imported products table
CREATE TABLE public.imported_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'error'
  last_synced_at TIMESTAMP WITH TIME ZONE,
  external_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, external_id)
);

-- Sync logs table
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'import', 'sync_prices', 'sync_stock', 'error'
  details TEXT,
  products_affected INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'warning'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own data
CREATE POLICY "Users manage own suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own imported products" ON public.imported_products FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own sync logs" ON public.sync_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own sync logs" ON public.sync_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins view all suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all imported products" ON public.imported_products FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all sync logs" ON public.sync_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for imported_products
CREATE TRIGGER update_imported_products_updated_at BEFORE UPDATE ON public.imported_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for sync status
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.imported_products;
