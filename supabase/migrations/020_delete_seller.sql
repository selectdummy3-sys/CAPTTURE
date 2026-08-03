-- 020: Allow admins to delete a seller (cascade to related data)

CREATE OR REPLACE FUNCTION public.delete_seller(p_seller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete store followers
  DELETE FROM store_followers WHERE seller_id = p_seller_id;

  -- Delete wishlist items for this seller's products
  DELETE FROM wishlist_items WHERE product_id IN (SELECT id FROM products WHERE seller_id = p_seller_id);

  -- Delete order_items for this seller's products
  DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE seller_id = p_seller_id);

  -- Delete products (images in storage are cleaned up separately)
  DELETE FROM products WHERE seller_id = p_seller_id;

  -- Delete withdrawal requests
  DELETE FROM withdrawal_requests WHERE seller_id = p_seller_id;

  -- Delete messages
  DELETE FROM messages WHERE seller_id = p_seller_id;

  -- Delete the seller row
  DELETE FROM sellers WHERE id = p_seller_id;
END;
$$;
