-- Buyers can read links for their own payments (needed by the payment return page).
create policy "payfast_order_links_select_own"
  on public.payfast_order_links
  for select
  to public
  using (
    exists (
      select 1 from public.payfast_payments pp
      where pp.id = payment_id and pp.buyer_user_id = auth.uid()
    )
  );

-- Admins manage links.
create policy "payfast_order_links_admin_all"
  on public.payfast_order_links
  for all
  to public
  using (is_admin())
  with check (is_admin());