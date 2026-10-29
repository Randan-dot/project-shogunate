import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { demoRooms, isDemoMode } from "@/lib/demo";
import type { ChatRoom } from "@/lib/types";

export const metadata = { title: "Chat" };

export default async function ChatPage() {
  let rooms: ChatRoom[] = [];
  if (isDemoMode()) {
    rooms = demoRooms;
  } else {
    const supabase = createClient();
    const { data } = await supabase.from("chat_rooms").select("*").order("name");
    rooms = (data ?? []) as ChatRoom[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-3xl">Chat rooms</h1>
        <p className="mt-1 text-sm text-washi-50/60">
          Real-time discussions. Log in to join the conversation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((r) => (
          <Link
            key={r.id}
            href={`/chat/${r.slug}`}
            className="card group p-5 transition-colors hover:border-torii/50"
          >
            <div className="flex items-center justify-between">
              <div className="heading-display text-lg group-hover:text-torii-400">
                {r.name}
              </div>
              <span className="text-matcha">● live</span>
            </div>
            <p className="mt-1 text-sm text-washi-100/60">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
