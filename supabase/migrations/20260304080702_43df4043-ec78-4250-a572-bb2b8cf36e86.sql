
CREATE TABLE IF NOT EXISTS public.data_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  purchase_id uuid REFERENCES public.data_purchases(id),
  request_type text NOT NULL DEFAULT 'data_purchase',
  data_categories text[] NOT NULL DEFAULT '{}',
  offered_price integer NOT NULL DEFAULT 0,
  message text,
  supplier_status text NOT NULL DEFAULT 'pending',
  supplier_responded_at timestamptz,
  admin_status text NOT NULL DEFAULT 'not_required',
  first_admin_id uuid,
  second_admin_id uuid,
  first_admin_approved_at timestamptz,
  second_admin_approved_at timestamptz,
  final_status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view incoming requests"
  ON public.data_access_requests FOR SELECT
  USING (auth.uid() = supplier_id);

CREATE POLICY "Buyers can view their requests"
  ON public.data_access_requests FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create requests"
  ON public.data_access_requests FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Suppliers can respond to requests"
  ON public.data_access_requests FOR UPDATE
  USING (auth.uid() = supplier_id AND supplier_status = 'pending');

CREATE POLICY "Admins can approve requests"
  ON public.data_access_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') AND admin_status IN ('pending', 'first_approved'));

CREATE POLICY "Admins can view all requests"
  ON public.data_access_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_data_access_requests_updated_at
  BEFORE UPDATE ON public.data_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.data_access_requests;
