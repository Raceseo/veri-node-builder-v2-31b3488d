-- Create function to generate notification on data sale
CREATE OR REPLACE FUNCTION public.notify_on_data_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert notification for the seller
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    NEW.user_id,
    'revenue',
    '💰 새로운 판매 수익!',
    NEW.buyer_company || '에서 데이터를 구매했습니다. +' || NEW.net_amount || ' VN',
    jsonb_build_object(
      'sale_id', NEW.id,
      'buyer_company', NEW.buyer_company,
      'amount', NEW.amount,
      'net_amount', NEW.net_amount,
      'categories', NEW.categories_sold
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on data_sale_records
CREATE TRIGGER on_data_sale_notify
AFTER INSERT ON public.data_sale_records
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_data_sale();