-- Read receipts for chat messages
create table if not exists public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique(message_id, user_id)
);

create index if not exists message_reads_message_idx on public.message_reads(message_id);
create index if not exists message_reads_user_idx on public.message_reads(user_id);

alter table public.message_reads enable row level security;

create policy "message_reads_read" on public.message_reads
  for select using (true);

create policy "message_reads_insert_own" on public.message_reads
  for insert to authenticated
  with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.message_reads;
exception
  when duplicate_object then null;
end $$;
