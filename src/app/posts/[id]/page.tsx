import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deletePost } from "@/lib/actions";
import {
  demoCurrentProfile,
  getDemoCommentsByPostId,
  getDemoPostById,
  isDemoMode,
} from "@/lib/demo";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import VoteButtons from "@/components/VoteButtons";
import CommentSection from "@/components/CommentSection";
import { canModerate } from "@/lib/roles";
import { formatTimestamp } from "@/lib/utils";
import type { Comment, Post, Profile } from "@/lib/types";

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const demo = isDemoMode();

  let typedPost: Post;
  let userVote: number | null = null;
  let profile: Profile | null = null;
  let comments: Comment[] = [];
  let userId: string | null = null;

  if (demo) {
    const p = getDemoPostById(params.id);
    if (!p) notFound();
    typedPost = p;
    userVote = p.user_vote ?? null;
    profile = demoCurrentProfile;
    userId = demoCurrentProfile.id;
    comments = getDemoCommentsByPostId(p.id);
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const { data: post } = await supabase
      .from("posts")
      .select("*, author:profiles(*), board:boards(*)")
      .eq("id", params.id)
      .single();
    if (!post) notFound();
    typedPost = post as Post;

    if (user) {
      const [{ data: v }, { data: p }] = await Promise.all([
        supabase
          .from("votes")
          .select("value")
          .eq("post_id", typedPost.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);
      userVote = v?.value ?? null;
      profile = (p as Profile) ?? null;
    }

    const { data: c } = await supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("post_id", typedPost.id)
      .order("created_at", { ascending: false });
    comments = (c ?? []) as Comment[];
  }

  const canDelete =
    profile &&
    (typedPost.author_id === profile.id || canModerate(profile.role));
  const deleteAction = deletePost.bind(null, typedPost.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={typedPost.board ? `/boards/${typedPost.board.slug}` : "/boards"}
        className="text-sm text-washi-50/50 transition-colors hover:text-torii-400"
      >
        ← back to {typedPost.board?.name ?? "boards"}
      </Link>

      <article className="card p-6">
        <div className="flex gap-4">
          <VoteButtons
            postId={typedPost.id}
            initialScore={typedPost.vote_score}
            initialVote={userVote}
            userId={userId}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-washi-50/50">
              {typedPost.board && (
                <span className="chip">
                  {typedPost.board.icon} {typedPost.board.name}
                </span>
              )}
              <span>{formatTimestamp(typedPost.created_at)}</span>
            </div>

            <h1 className="heading-display mt-2 text-2xl leading-tight sm:text-3xl">
              {typedPost.title}
            </h1>

            {typedPost.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {typedPost.tags.map((t) => (
                  <span key={t} className="chip text-washi-50/60">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {typedPost.content && (
              <p className="mt-4 whitespace-pre-wrap break-words text-washi-100">
                {typedPost.content}
              </p>
            )}

            {typedPost.author && (
              <div className="mt-5 flex items-center justify-between border-t border-washi-50/10 pt-4">
                <Link
                  href={`/u/${typedPost.author.username}`}
                  className="flex items-center gap-2.5"
                >
                  <Avatar profile={typedPost.author} size={36} />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-washi-100">
                      {typedPost.author.display_name ||
                        typedPost.author.username}
                      <RoleBadge role={typedPost.author.role} />
                    </div>
                    <div className="text-xs text-washi-50/50">
                      @{typedPost.author.username}
                    </div>
                  </div>
                </Link>

                {canDelete && (
                  <form action={deleteAction}>
                    <button className="btn-ghost border-torii/40 px-3 py-1.5 text-xs text-torii-400 hover:border-torii">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      <CommentSection
        postId={typedPost.id}
        initialComments={comments}
        currentProfile={profile}
      />
    </div>
  );
}
