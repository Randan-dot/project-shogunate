import Link from "next/link";
import type { Post } from "@/lib/types";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import VoteButtons from "@/components/VoteButtons";
import { timeAgo } from "@/lib/utils";

export default function PostCard({
  post,
  userId,
}: {
  post: Post;
  userId: string | null;
}) {
  return (
    <article className="card flex gap-4 p-4 sm:p-5">
      <VoteButtons
        postId={post.id}
        initialScore={post.vote_score}
        initialVote={post.user_vote ?? null}
        userId={userId}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-washi-50/50">
          {post.board && (
            <span className="chip">
              {post.board.icon} {post.board.name}
            </span>
          )}
          <span>{timeAgo(post.created_at)}</span>
        </div>

        <Link
          href={`/posts/${post.id}`}
          className="heading-display mt-1.5 block text-lg text-washi-50 transition-colors hover:text-torii-400"
        >
          {post.title}
        </Link>

        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="chip text-washi-50/60">
                #{t}
              </span>
            ))}
          </div>
        )}

        {post.author && (
          <div className="mt-3 flex items-center gap-2 text-xs text-washi-50/60">
            <Avatar profile={post.author} size={22} />
            <span>{post.author.display_name || post.author.username}</span>
            <RoleBadge role={post.author.role} />
          </div>
        )}
      </div>
    </article>
  );
}
