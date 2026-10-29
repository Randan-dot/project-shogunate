import { createClient } from "@/lib/supabase/server";
import { createPost } from "@/lib/actions";
import { demoBoards, isDemoMode } from "@/lib/demo";
import type { Board } from "@/lib/types";

export const metadata = { title: "New post" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: { board?: string };
}) {
  let boards: Board[] = [];
  if (isDemoMode()) {
    boards = demoBoards;
  } else {
    const supabase = createClient();
    const { data } = await supabase.from("boards").select("*").order("name");
    boards = (data ?? []) as Board[];
  }

  const preselected = boards.find((b) => b.slug === searchParams.board);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="heading-display text-3xl">New post</h1>
        <p className="mt-1 text-sm text-washi-50/60">
          Share something with the community.
        </p>
      </div>

      <form action={createPost} className="card space-y-5 p-6">
        <div>
          <label htmlFor="board_id" className="label">
            Board
          </label>
          <select
            id="board_id"
            name="board_id"
            className="input"
            defaultValue={preselected?.id}
            required
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.icon} {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            name="title"
            className="input"
            required
            placeholder="A clear, descriptive title"
          />
        </div>

        <div>
          <label htmlFor="content" className="label">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            className="input min-h-[180px] resize-y"
            placeholder="Write your post…"
          />
        </div>

        <div>
          <label htmlFor="tags" className="label">
            Tags <span className="normal-case text-washi-50/40">(comma separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            className="input"
            placeholder="anime, manga, seasonal"
          />
        </div>

        <button type="submit" className="btn-primary">
          Publish post
        </button>
      </form>
    </div>
  );
}
