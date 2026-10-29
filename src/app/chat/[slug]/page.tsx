import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  demoCurrentProfile,
  getDemoMessagesByRoomId,
  getDemoRoomBySlug,
  isDemoMode,
} from "@/lib/demo";
import ChatRoom from "@/components/ChatRoom";
import type { ChatRoom as Room, Message, Profile } from "@/lib/types";

export default async function ChatRoomPage({
  params,
}: {
  params: { slug: string };
}) {
  const demo = isDemoMode();

  let room: Room;
  let profile: Profile | null = null;
  let messages: Message[] = [];

  if (demo) {
    const r = getDemoRoomBySlug(params.slug);
    if (!r) notFound();
    room = r;
    profile = demoCurrentProfile;
    messages = getDemoMessagesByRoomId(room.id);
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: r } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("slug", params.slug)
      .single();
    if (!r) notFound();
    room = r as Room;

    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = (p as Profile) ?? null;
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(200);
    messages = (msgs ?? []) as Message[];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ChatRoom
        room={room}
        initialMessages={messages}
        currentProfile={profile}
        demo={demo}
      />
    </div>
  );
}
