-- Allow a seller to re-apply after rejection.
-- Previously sellers_update_own_pending only allowed updates while the row was
-- already 'pending', so the re-apply UPDATE from a 'rejected' row was silently
-- filtered by RLS and the row never changed (profile kept showing 'declined').
alter policy "sellers_update_own_pending" on public.sellers
  using ((user_id = (select auth.uid()) and application_status = any (array['pending'::text, 'rejected'::text])))
  with check ((user_id = (select auth.uid()) and application_status = 'pending'::text));