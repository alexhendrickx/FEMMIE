-- Femmie: Supabase schema for E2EE sync.
-- Paste this into the Supabase SQL editor (Project → SQL Editor → New query) and run once.
-- The server only ever stores ciphertext (`payload`, `wrapped_dek`) — RLS below
-- ensures a user can only ever see their own rows.

-- logs: one encrypted blob per daily entry, owned by auth.uid()
create table public.logs (
  id          text not null,                 -- client-generated log id
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null,                 -- plaintext date is acceptable metadata
  payload     text not null,                 -- JSON EncryptedPayload (ciphertext)
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.logs enable row level security;
create policy "own rows" on public.logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- key material: one wrapped DEK per user
create table public.key_material (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  wrapped_dek text not null,                 -- DEK encrypted with passphrase-KEK
  salt        text not null,
  kdf_params  jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.key_material enable row level security;
create policy "own key" on public.key_material
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
