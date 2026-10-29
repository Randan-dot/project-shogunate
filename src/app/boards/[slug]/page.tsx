import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  demoCurrentProfile,
  demoPosts,
  getDemoBoardBySlug,
  isDemoMode,
} from "@/lib/demo";
import PostCard from "@/components/PostCard";
import type { Board, Post } from "@/lib/types";

export default async function BoardPage({
  params,
}: {
  params: { slug: string };
}) {
  const demo = isDemoMode();

  let board: Board;
  let typedPosts: Post[] = [];
  let userId: string | null = null;
  const userVotes: Record<string, number> = {};

  if (demo) {
    const b = getDemoBoardBySlug(params.slug);
    if (!b) notFound();
    board = b;
    typedPosts = demoPosts
      .filter((p) => p.board_id === board.id)
      .sort((a, b2) => (a.created_at < b2.created_at ? 1 : -1));
    userId = demoCurrentProfile.id;
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const { data: b } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", params.slug)
      .single();
    if (!b) notFound();
    board = b as Board;

    const { data: posts } = await supabase
      .from("posts")
      .select("*, author:profiles(*), board:boards(*)")
      .eq("board_id", board.id)
      .order("created_at", { ascending: false });
    typedPosts = (posts ?? []) as Post[];

    if (user && typedPosts.length > 0) {
      const { data: votes } = await supabase
        .from("votes")
        .select("post_id, value")
        .eq("user_id", user.id)
        .in(
          "post_id",
          typedPosts.map((p) => p.id)
        );
      for (const v of votes ?? []) {
        userVotes[v.post_id] = v.value;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{board.icon}</span>
            <h1 className="heading-display text-3xl">{board.name}</h1>
          </div>
          <p className="mt-1 text-sm text-washi-50/60">{board.description}</p>
        </div>
        <Link href={`/posts/new?board=${params.slug}`} className="btn-primary">
          + New post
        </Link>
      </div>

      <div className="space-y-3">
        {typedPosts.length === 0 && (
          <p className="card p-6 text-sm text-washi-50/50">
            No posts here yet. Start the conversation.
          </p>
        )}
        {typedPosts.map((p) => (
          <PostCard
            key={p.id}
            post={{ ...p, user_vote: userVotes[p.id] ?? p.user_vote ?? null }}
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}
