alter publication supabase_realtime add table global_chat;
alter table global_chat enable row level security;
create policy "Everyone can view chat"
on global_chat
for select
to authenticated
using (true);
create policy "Users can insert messages"
on global_chat
for insert
to authenticated
with check (auth.uid() = user_id);
alter table global_chat replica identity full;
