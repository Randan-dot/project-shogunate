-- ============================================================================
-- Shogunate — Seed data
-- Run after the migration. Safe to run repeatedly (idempotent).
-- ============================================================================

-- Community boards
insert into public.boards (slug, name, description, icon) values
  ('anime',   'Anime',   'Seasonal shows, classics, and manga talk.',            '🌸'),
  ('tech',    'Tech',    'Programming, hardware, and the cutting edge.',         '⚙️'),
  ('gaming',  'Gaming',  'Video games, retro to next-gen.',                       '🎮'),
  ('culture', 'Japanese Culture', 'History, language, food, and traditions.',    '⛩️')
on conflict (slug) do nothing;

-- Chat rooms
insert into public.chat_rooms (slug, name, description) values
  ('general',     'General',     'Casual conversation for everyone.'),
  ('anime-night', 'Anime Night', 'Live discussion of currently airing anime.'),
  ('tech-dojo',   'Tech Dojo',   'Code, gadgets, and help.'),
  ('gaming',      'Gaming',      'LFG, clips, and hype.'),
  ('culture-tea', 'Culture & Tea', 'Language, history, and traditions.')
on conflict (slug) do nothing;
