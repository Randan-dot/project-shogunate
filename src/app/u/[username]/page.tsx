import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  demoCurrentProfile,
  demoPosts,
  getDemoProfileByUsername,
  isDemoMode,
} from "@/lib/demo";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import PostCard from "@/components/PostCard";
import { formatTimestamp } from "@/lib/utils";
import type { Post, Profile } from "@/lib/types";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const demo = isDemoMode();

  let p: Profile;
  let posts: Post[] = [];
  let userId: string | null = null;

  if (demo) {
    const found = getDemoProfileByUsername(params.username);
    if (!found) notFound();
    p = found;
    posts = demoPosts
      .filter((post) => post.author_id === p.id)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    userId = demoCurrentProfile.id;
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .single();
    if (!profile) notFound();
    p = profile as Profile;

    const { data: ps } = await supabase
      .from("posts")
      .select("*, board:boards(*), author:profiles(*)")
      .eq("author_id", p.id)
      .order("created_at", { ascending: false })
      .limit(20);
    posts = (ps ?? []) as Post[];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex items-center gap-5 p-6">
        <Avatar profile={p} size={80} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="heading-display text-2xl">
              {p.display_name || p.username}
            </h1>
            <RoleBadge role={p.role} />
          </div>
          <div className="text-sm text-washi-50/50">
            @{p.username} · joined {formatTimestamp(p.created_at)}
          </div>
          <p className="mt-2 text-sm text-washi-100/80">
            {p.bio || "No bio yet."}
          </p>
        </div>
      </div>

      <section>
        <h2 className="heading-display text-xl">Posts</h2>
        <div className="mt-3 space-y-3">
          {posts.length === 0 && (
            <p className="text-sm text-washi-50/50">No posts yet.</p>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} userId={userId} />
          ))}
        </div>
      </section>
    </div>
  );
}
