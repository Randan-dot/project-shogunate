# Shogunate ⛩️

A Japanese-culture themed community chat platform — a Reddit-style hub with
community boards, up/down votes, realtime chat rooms, and a rank system based on
the feudal hierarchy.

| Role    | Meaning          | Powers                                                        |
| ------- | ---------------- | ------------------------------------------------------------- |
| **Shogun** | Admin           | Ban members, assign roles (promote Ronin → Samurai), delete anything |
| **Samurai** | Moderator      | Mute members, delete posts/comments/messages                  |
| **Ronin**   | Member          | Post, comment, vote, and chat                                  |

## Tech stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage) — no separate server needed
- **Realtime chat:** Supabase Realtime (websockets) via PostgreSQL change subscriptions
- **Aesthetics:** Shippori Mincho (calligraphy headers), torii gate + katana SVG art,
  falling sakura petals, and a vermillion/ink/sakura palette

## Features

- Email sign-up / login (Supabase Auth), with auto-created profiles
- Rank-based roles (Shogun / Samurai / Ronin) enforced at the database level with RLS
- Community boards: Anime, Tech, Gaming, Japanese Culture (seeded)
- Posts with title, content, and tags
- Upvote / downvote with live score (denormalized via trigger)
- Comments
- Realtime chat rooms with live messaging
- Role-based moderation: Shogun bans, Samurai mutes (enforced in DB policies)
- Profiles with avatars (Supabase Storage) and rank badges
- Responsive layout for mobile and desktop

---

## Preview without Supabase (demo mode)

If you run the app before adding Supabase credentials, it automatically switches
to **demo mode** and renders with sample data so you can see the full UI:

```bash
pnpm build
pnpm start   # then open http://localhost:3000
```

Demo mode activates whenever `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing. Add your real keys to `.env.local`
and restart to switch to live data.

---

## Getting started

### 1. Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- A free [Supabase](https://supabase.com) account

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (e.g. `shogunate`) and a database password.
3. Wait for the project to finish provisioning.

### 3. Run the database migration

1. In your Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the **entire** contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it.
3. Then paste and run [`supabase/seed.sql`](supabase/seed.sql) to add the boards
   and chat rooms.

> This creates the `profiles`, `boards`, `posts`, `votes`, `comments`,
> `chat_rooms`, `messages`, and `moderation` tables, enables Row Level Security,
> and wires up the realtime publication.

For an existing installation, also run
[`supabase/migrations/0002_chat_image_uploads.sql`](supabase/migrations/0002_chat_image_uploads.sql)
in the Supabase SQL Editor. This adds the `chat-images` Storage bucket and the
`image_url` field used by chat attachments. Avatar and chat uploads accept JPG,
PNG, GIF, and WebP images up to 5 MB. Redeploy the app on Vercel after applying
the migration.

### 4. Configure environment variables

1. In Supabase → **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key
2. Copy `.env.example` to `.env.local` and fill them in:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 5. Configure auth URLs

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/confirm`

> Email confirmation is handled by the `/auth/confirm` route. In local dev you
> can disable it: **Authentication → Providers → Email → Confirm email: OFF**
> (then signups log in immediately).

### 6. Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Promote yourself to Shogun

The first account is created as a **Ronin**. To become the Shogun, run this once
in the Supabase SQL Editor (replace the username):

```sql
update public.profiles
set role = 'shogun'
where username = 'your_username';
```

Then open the **Admin** link in the navbar to ban/mute members and promote
Ronin to Samurai.

---

## Project structure

```
src/
  app/
    (auth)/login, signup     # auth pages
    auth/confirm/route.ts    # email verification handler
    boards/                  # board list + [slug] detail
    posts/                   # new post form + [id] detail
    chat/                    # room list + [slug] realtime room
    profile/                 # own profile (edit avatar/bio)
    u/[username]/            # public profile
    admin/                   # moderation dashboard
    page.tsx                 # landing
  components/                # UI (Navbar, ToriiGate, ChatRoom, VoteButtons, …)
  lib/
    supabase/                # browser/server clients + middleware
    actions.ts               # server actions (moderation, posts, roles)
    roles.ts                 # role helpers + permission checks
    types.ts                 # shared types
supabase/
  migrations/0001_init.sql   # full schema + RLS + triggers
  seed.sql                   # boards + chat rooms
```

## Security model

All authorization lives in PostgreSQL via Row Level Security:

- `profiles` — public read; self-edit only; role changes restricted to Shogun
  (via triggers `prevent_role_escalation` + `restrict_profile_updates`)
- `posts`/`comments` — public read; insert requires login + not banned; delete by
  author or moderator
- `votes` — upsert own vote only (unique per post/user); score synced by trigger
- `messages` — public read; insert blocked for banned *or* muted users
- `moderation` — only moderators (Samurai/Shogun) can write

This means even if the UI is bypassed, the database enforces the rank rules.
