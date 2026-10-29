"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Comment, Profile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import { timeAgo } from "@/lib/utils";
import { canModerate } from "@/lib/roles";

export default function CommentSection({
  postId,
  initialComments,
  currentProfile,
}: {
  postId: string;
  initialComments: Comment[];
  currentProfile: Profile | null;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProfile) {
      router.push("/login");
      return;
    }
    const text = body.trim();
    if (!text) return;

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: currentProfile.id, content: text })
      .select("id, created_at")
      .single();
    setBusy(false);

    if (!error && data) {
      setComments((prev) => [
        {
          id: data.id,
          post_id: postId,
          author_id: currentProfile.id,
          content: text,
          created_at: data.created_at,
          author: currentProfile,
        },
        ...prev,
      ]);
      setBody("");
      router.refresh();
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="heading-display text-xl">
        Comments{" "}
        <span className="text-base text-washi-50/50">({comments.length})</span>
      </h3>

      <form onSubmit={submit} className="card flex gap-3 p-4">
        <input
          className="input flex-1"
          placeholder={
            currentProfile ? "Write a comment…" : "Log in to comment"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!currentProfile || busy}
        />
        <button
          type="submit"
          disabled={!currentProfile || busy || !body.trim()}
          className="btn-primary shrink-0"
        >
          Post
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-washi-50/50">
            No comments yet — be the first.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="card flex gap-3 p-4">
            {c.author && <Avatar profile={c.author} size={32} />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {c.author && (
                  <>
                    <span className="text-washi-100">
                      {c.author.display_name || c.author.username}
                    </span>
                    <RoleBadge role={c.author.role} />
                  </>
                )}
                <span className="text-washi-50/50">{timeAgo(c.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-washi-100">
                {c.content}
              </p>
            </div>
            {currentProfile &&
              (c.author_id === currentProfile.id ||
                canModerate(currentProfile.role)) && (
                <button
                  onClick={() => remove(c.id)}
                  className="self-start rounded p-1 text-washi-50/40 transition-colors hover:text-torii-400"
                  aria-label="Delete comment"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v.5H6V5Zm-2 1.5h12a.5.5 0 0 1 0 1h-.7l-.6 7.5A1.5 1.5 0 0 1 13.2 16.5H6.8a1.5 1.5 0 0 1-1.5-1.4L4.7 7.5H4a.5.5 0 0 1 0-1Z" />
                  </svg>
                </button>
              )}
          </div>
        ))}
      </div>
    </section>
  );
}
