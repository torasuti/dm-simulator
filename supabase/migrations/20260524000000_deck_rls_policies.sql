alter table public.decks enable row level security;

drop policy if exists "decks_select_own" on public.decks;
drop policy if exists "decks_insert_own" on public.decks;
drop policy if exists "decks_update_own" on public.decks;
drop policy if exists "decks_delete_own" on public.decks;

create policy "decks_select_own"
on public.decks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "decks_insert_own"
on public.decks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "decks_update_own"
on public.decks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "decks_delete_own"
on public.decks
for delete
to authenticated
using ((select auth.uid()) = user_id);
