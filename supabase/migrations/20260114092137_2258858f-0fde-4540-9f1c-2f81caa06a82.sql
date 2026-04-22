-- Enable realtime for supplier_payouts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_payouts;

-- Enable realtime for data_purchases table
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_purchases;