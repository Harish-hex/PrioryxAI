-- Security-review hardening for the additive spec schema
-- (20260913120000_prioryxai_spec_schema.sql).
--
-- Findings addressed:
--
-- 1. Authorization: `for all using (auth.uid() = user_id)` policies relied
--    on Postgres implicitly reusing USING as WITH CHECK for INSERT. Made
--    explicit on every per-user table so INSERT authorization is
--    unambiguous and doesn't depend on that implicit behavior.
-- 2. Authorization: user_id columns on career_graph/actions/outcomes/
--    integrations/score_history/job_matches were nullable. A row with
--    NULL user_id would match no policy for any user, becoming a
--    permanently inaccessible orphan - a data-integrity/authorization
--    dead zone. Verified zero existing NULLs (backfill always sets a
--    real user_id), so NOT NULL is safe to add now.
-- 3. Sensitive data exposure: integrations.access_token/refresh_token are
--    plain `text` columns. Per the spec, these must be encrypted
--    (AES-256-GCM) by the application BEFORE insert, using ENCRYPTION_KEY
--    - this is an application-layer requirement (enforced when the
--    integrations write path is built in Step 6/7), not something SQL
--    alone can guarantee. Documented via column comments so it isn't
--    missed.

alter table public.career_graph alter column user_id set not null;
alter table public.actions alter column user_id set not null;
alter table public.outcomes alter column user_id set not null;
alter table public.integrations alter column user_id set not null;
alter table public.score_history alter column user_id set not null;
alter table public.job_matches alter column user_id set not null;

drop policy if exists "Users own their profile" on public.profiles;
create policy "Users own their profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users own their career graph" on public.career_graph;
create policy "Users own their career graph" on public.career_graph
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their actions" on public.actions;
create policy "Users own their actions" on public.actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their outcomes" on public.outcomes;
create policy "Users own their outcomes" on public.outcomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their integrations" on public.integrations;
create policy "Users own their integrations" on public.integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their score history" on public.score_history;
create policy "Users own their score history" on public.score_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their job matches" on public.job_matches;
create policy "Users own their job matches" on public.job_matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on column public.integrations.access_token is
  'MUST be encrypted (AES-256-GCM, ENCRYPTION_KEY env var) by the application before insert. Never write plaintext tokens here.';
comment on column public.integrations.refresh_token is
  'MUST be encrypted (AES-256-GCM, ENCRYPTION_KEY env var) by the application before insert. Never write plaintext tokens here.';
