"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function VoteButtons({
  postId,
  initialScore,
  initialVote,
  userId,
}: {
  postId: string;
  initialScore: number;
  initialVote: number | null;
  userId: string | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<number | null>(initialVote);
  const [pending, setPending] = useState(false);

  async function handleVote(value: 1 | -1) {
    if (!userId) {
      router.push("/login");
      return;
    }

    const prevScore = score;
    const prevVote = vote;

    let newVote: number | null;
    let newScore: number;
    if (vote === value) {
      newVote = null;
      newScore = score - value;
    } else if (vote === -value) {
      newVote = value;
      newScore = score + 2 * value;
    } else {
      newVote = value;
      newScore = score + value;
    }

    setVote(newVote);
    setScore(newScore);
    setPending(true);

    const supabase = createClient();
    let error: unknown = null;

    if (newVote === null) {
      const res = await supabase
        .from("votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      error = res.error;
    } else {
      const res = await supabase.from("votes").upsert(
        { post_id: postId, user_id: userId, value: newVote },
        { onConflict: "post_id,user_id" }
      );
      error = res.error;
    }

    setPending(false);

    if (error) {
      setVote(prevVote);
      setScore(prevScore);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        aria-label="Upvote"
        disabled={pending}
        onClick={() => handleVote(1)}
        className={cn(
          "rounded-md p-1.5 transition-colors hover:text-torii-400 disabled:opacity-50",
          vote === 1 ? "text-torii-400" : "text-washi-50/40"
        )}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M10 5a.75.75 0 0 1 .53.22l3.25 3.25a.75.75 0 1 1-1.06 1.06L10 6.81 7.28 9.53a.75.75 0 0 1-1.06-1.06l3.25-3.25A.75.75 0 0 1 10 5Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <span className="font-display text-sm font-bold text-washi-100">
        {score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        disabled={pending}
        onClick={() => handleVote(-1)}
        className={cn(
          "rounded-md p-1.5 transition-colors hover:text-torii-400 disabled:opacity-50",
          vote === -1 ? "text-torii-400" : "text-washi-50/40"
        )}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M10 15a.75.75 0 0 1-.53-.22l-3.25-3.25a.75.75 0 1 1 1.06-1.06L10 13.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25A.75.75 0 0 1 10 15Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
