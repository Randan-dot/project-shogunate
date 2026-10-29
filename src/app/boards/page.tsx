import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { demoBoards, demoPosts, isDemoMode } from "@/lib/demo";

export const metadata = { title: "Boards" };

type BoardWithCount = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  posts: { count: number }[];
};

export default async function BoardsPage() {
  let boards: BoardWithCount[] = [];

  if (isDemoMode()) {
    boards = demoBoards.map((b) => ({
      ...b,
      posts: [{ count: demoPosts.filter((p) => p.board_id === b.id).length }],
    }));
  } else {
    const supabase = createClient();
    const { data } = await supabase
      .from("boards")
      .select("*, posts(count)")
      .order("name");
    boards = (data ?? []) as BoardWithCount[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-3xl">Community boards</h1>
        <p className="mt-1 text-sm text-washi-50/60">
          Pick a board and join the conversation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {boards.map((b) => {
          const count = b.posts?.[0]?.count ?? 0;
          return (
            <Link
              key={b.id}
              href={`/boards/${b.slug}`}
              className="card group p-6 transition-colors hover:border-torii/50"
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{b.icon}</div>
                <span className="text-xs text-washi-50/40">{count} posts</span>
              </div>
              <div className="heading-display mt-3 text-xl group-hover:text-torii-400">
                {b.name}
              </div>
              <p className="mt-1 text-sm text-washi-100/60">{b.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
