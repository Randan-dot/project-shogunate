import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  demoBoards,
  demoCurrentProfile,
  demoPosts,
  demoRooms,
  isDemoMode,
} from "@/lib/demo";
import ToriiGate from "@/components/ToriiGate";
import KatanaDivider from "@/components/KatanaDivider";
import PostCard from "@/components/PostCard";
import type { Board, ChatRoom, Post } from "@/lib/types";

const ROLES = [
  {
    kanji: "将",
    name: "Shogun",
    desc: "Administrator — ban members and keep the peace.",
    accent: "text-kin",
  },
  {
    kanji: "侍",
    name: "Samurai",
    desc: "Moderator — mute and remove offending content.",
    accent: "text-torii-400",
  },
  {
    kanji: "浪",
    name: "Ronin",
    desc: "Member — post, vote, and chat across the realm.",
    accent: "text-washi-100",
  },
];

export default async function Home() {
  const demo = isDemoMode();

  let userId: string | null = null;
  let boards: Board[] = [];
  let posts: Post[] = [];
  let rooms: ChatRoom[] = [];

  if (demo) {
    userId = demoCurrentProfile.id;
    boards = demoBoards;
    posts = demoPosts
      .slice()
      .sort((a, b) => b.vote_score - a.vote_score)
      .slice(0, 5);
    rooms = demoRooms;
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const [boardsRes, postsRes, roomsRes] = await Promise.all([
      supabase.from("boards").select("*").order("name"),
      supabase
        .from("posts")
        .select("*, board:boards(*), author:profiles(*)")
        .order("vote_score", { ascending: false })
        .limit(5),
      supabase.from("chat_rooms").select("*").order("name"),
    ]);

    boards = (boardsRes.data ?? []) as Board[];
    posts = (postsRes.data ?? []) as Post[];
    rooms = (roomsRes.data ?? []) as ChatRoom[];
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="flex flex-col items-center pt-8 text-center sm:pt-16">
        <div className="animate-fade-up">
          <ToriiGate className="h-24 w-24 sm:h-32 sm:w-32" />
        </div>
        <h1 className="heading-display mt-6 text-4xl leading-tight sm:text-6xl">
          Shogunate
        </h1>
        <p className="heading-display mt-2 text-lg text-sakura-300 sm:text-2xl">
          ようこそ — welcome to the realm
        </p>
        <p className="mt-4 max-w-xl text-washi-100/80">
          A community hub for Japanese culture and fandom. Discuss anime, tech,
          and gaming, join live rooms, and rise through the ranks from Ronin to
          Samurai — and maybe Shogun.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={userId ? "/boards" : "/signup"} className="btn-primary px-6 py-3">
            {userId ? "Enter the boards" : "Join the clan"}
          </Link>
          <Link href="/chat" className="btn-ghost px-6 py-3">
            Visit chat
          </Link>
        </div>
      </section>

      <KatanaDivider />

      {/* Roles */}
      <section>
        <h2 className="heading-display text-center text-2xl">The ranks</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.name} className="card p-6 text-center">
              <div className={`font-display text-4xl ${r.accent}`}>{r.kanji}</div>
              <div className={`heading-display mt-2 text-xl ${r.accent}`}>
                {r.name}
              </div>
              <p className="mt-2 text-sm text-washi-100/70">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Boards */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl">Community boards</h2>
          <Link href="/boards" className="text-sm text-torii-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {boards.map((b) => (
            <Link
              key={b.id}
              href={`/boards/${b.slug}`}
              className="card group p-5 transition-colors hover:border-torii/50"
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="heading-display mt-2 text-lg group-hover:text-torii-400">
                {b.name}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-washi-100/60">
                {b.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl">Trending posts</h2>
          <Link
            href="/posts/new"
            className="btn-primary px-4 py-2 text-sm"
          >
            + New post
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {posts.length === 0 && (
            <p className="text-sm text-washi-50/50">
              No posts yet — be the first to write one.
            </p>
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} userId={userId} />
          ))}
        </div>
      </section>

      {/* Chat rooms */}
      <section>
        <h2 className="heading-display text-2xl">Live rooms</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Link
              key={r.id}
              href={`/chat/${r.slug}`}
              className="card flex items-center justify-between p-4 transition-colors hover:border-torii/50"
            >
              <div>
                <div className="font-medium text-washi-100">{r.name}</div>
                <div className="text-xs text-washi-50/50">{r.description}</div>
              </div>
              <span className="text-matcha">●</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
