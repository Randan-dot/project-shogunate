"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoom as Room, Message, Profile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";
import { canModerate, canMute } from "@/lib/roles";
import { muteUser } from "@/lib/actions";

function buildSenderMap(
  initialMessages: Message[],
  currentProfile: Profile | null
): Record<string, Profile> {
  const map: Record<string, Profile> = {};
  for (const m of initialMessages) {
    if (m.sender) map[m.sender_id] = m.sender;
  }
  if (currentProfile) map[currentProfile.id] = currentProfile;
  return map;
}

export default function ChatRoom({
  room,
  initialMessages,
  currentProfile,
  demo = false,
}: {
  room: Room;
  initialMessages: Message[];
  currentProfile: Profile | null;
  demo?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [readMap, setReadMap] = useState<Record<string, string[]>>({});

  const sendersRef = useRef<Record<string, Profile>>(
    buildSenderMap(initialMessages, currentProfile)
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (demo) return;
    const supabase = createClient();

    async function loadReads() {
      if (!currentProfile) return;
      const messageIds = messages.map((m) => m.id);
      if (messageIds.length === 0) return;
      const { data } = await supabase
        .from("message_reads")
        .select("message_id, user_id")
        .in("message_id", messageIds);
      if (data) {
        const map: Record<string, string[]> = {};
        for (const r of data as any[]) {
          if (!map[r.message_id]) map[r.message_id] = [];
          map[r.message_id].push(r.user_id);
        }
        setReadMap(map);
      }
    }
    loadReads();
  }, [messages, currentProfile, demo]);

  useEffect(() => {
    if (demo || !currentProfile) return;
    const supabase = createClient();

    async function markAllAsRead() {
      if (!currentProfile) return;
      const profileId = currentProfile.id;
      const unread = messages.filter((m) => m.sender_id !== profileId);
      for (const m of unread) {
        const readers = readMap[m.id] || [];
        if (readers.includes(profileId)) continue;
        await supabase.from("message_reads").upsert(
          { message_id: m.id, user_id: profileId },
          { onConflict: "message_id,user_id", ignoreDuplicates: true }
        );
      }
    }
    markAllAsRead();
  }, [messages, currentProfile, demo, readMap]);

  useEffect(() => {
    if (demo) return;

    const supabase = createClient();

    async function ensureSender(senderId: string) {
      const cached = sendersRef.current[senderId];
      if (cached) return cached;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", senderId)
        .single();
      if (data) {
        sendersRef.current[senderId] = data as Profile;
        return data as Profile;
      }
      return null;
    }

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          const sender = await ensureSender(msg.sender_id);
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id)
              ? prev
              : [...prev, { ...msg, sender: sender ?? undefined }]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reads",
        },
        (payload) => {
          const rec = payload.new as any;
          setReadMap((prev) => {
            const arr = prev[rec.message_id] || [];
            if (arr.includes(rec.user_id)) return prev;
            return { ...prev, [rec.message_id]: [...arr, rec.user_id] };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, demo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProfile) {
      router.push("/login");
      return;
    }
    const content = draft.trim();
    if ((!content && !imageFile) || sending) return;

    if (demo) {
      setDraft("");
      setImageFile(null);
      return;
    }

    setSending(true);
    setError("");
    const supabase = createClient();
    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const path = `${currentProfile.id}/${room.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setSending(false);
        return;
      }
      imageUrl = supabase.storage.from("chat-images").getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: room.id, sender_id: currentProfile.id, content, image_url: imageUrl })
      .select("id, created_at, image_url")
      .single();
    setSending(false);

    if (error) {
      setError(
        error.code === "42501" || error.message.includes("policy")
          ? "You may be muted or banned from this chat."
          : error.message
      );
    } else if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id)
          ? prev
          : [
              ...prev,
              {
                id: data.id,
                room_id: room.id,
                sender_id: currentProfile.id,
                content,
                image_url: data.image_url,
                created_at: data.created_at,
                sender: currentProfile,
              },
            ]
      );
      setDraft("");
      setImageFile(null);
      inputRef.current?.focus();
    }
  }

  async function remove(id: string) {
    if (demo) return;
    const supabase = createClient();
    await supabase.from("messages").delete().eq("id", id);
  }

  function onMute(target: Profile) {
    if (demo) return;
    if (
      window.confirm(
        `Mute ${target.display_name || target.username} from this chat?`
      )
    ) {
      muteUser(target.id, "Muted in chat");
      router.refresh();
    }
  }

  const viewerCanModerate = canModerate(currentProfile?.role ?? null);
  const viewerCanMute = canMute(currentProfile?.role ?? null);

  function getTicks(m: Message) {
    if (!currentProfile || m.sender_id !== currentProfile.id) return null;
    const readers = readMap[m.id] || [];
    const othersRead = readers.some((uid) => uid !== currentProfile.id);
    if (othersRead) {
      return (
        <span className="ml-1 text-[10px] text-sky-300" title="Seen">
          ??
        </span>
      );
    }
    return (
      <span className="ml-1 text-[10px] text-washi-50/40" title="Delivered">
        ?
      </span>
    );
  }

  function formatTime(ts: string) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeAgo(ts);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-washi-50/10 bg-gradient-to-b from-ink/80 to-ink shadow-xl md:h-[75vh]">
      <div className="flex items-center gap-3 border-b border-washi-50/10 bg-ink/60 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden rounded-full p-1.5 text-washi-50/70 hover:bg-washi-50/5 hover:text-washi-100"
          aria-label="Back"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="heading-display text-base md:text-lg truncate">{room.name}</h2>
          {room.description && (
            <p className="text-xs text-washi-50/50 truncate">{room.description}</p>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-matcha">
          <span className="h-1.5 w-1.5 rounded-full bg-matcha animate-pulse" />
          live
        </span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-2 py-4 md:px-4">
        {messages.map((m, idx) => {
          const sender = m.sender || sendersRef.current[m.sender_id];
          const isOwn = currentProfile?.id === m.sender_id;
          const canDelete = isOwn || viewerCanModerate;
          const canMuteSender =
            viewerCanMute &&
            sender &&
            sender.role === "ronin" &&
            sender.id !== currentProfile?.id;

          const showTail = idx === messages.length - 1 || messages[idx + 1]?.sender_id !== m.sender_id;
          const showHeader = idx === 0 || messages[idx - 1]?.sender_id !== m.sender_id || messages[idx - 1]?.room_id !== m.room_id;

          return (
            <div key={m.id} className={`group flex ${isOwn ? "justify-end" : "justify-start"} px-1`}>
              <div className={`flex max-w-[85%] gap-2 md:max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {!isOwn && showHeader && sender ? (
                  <Avatar profile={sender} size={32} />
                ) : !isOwn ? (
                  <div className="w-8" />
                ) : null}
                <div className="flex flex-col">
                  {!isOwn && showHeader && sender && (
                    <div className="mb-0.5 ml-1 flex items-center gap-1.5 text-[11px]">
                      <span className="font-medium text-washi-100/90">{sender.display_name || sender.username}</span>
                    </div>
                  )}
                  <div
                    className={`relative rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
                      isOwn
                        ? "rounded-br-md bg-gradient-to-br from-torii-500/90 to-torii-600/90 text-white"
                        : "rounded-bl-md bg-washi-50/10 text-washi-100 backdrop-blur"
                    }`}
                  >
                    {m.image_url && (
                      <a href={m.image_url} target="_blank" rel="noreferrer" className="mb-1 block overflow-hidden rounded-lg">
                        <Image
                          src={m.image_url}
                          alt="Image shared in chat"
                          width={400}
                          height={300}
                          unoptimized
                          className="max-h-60 w-full object-cover"
                        />
                      </a>
                    )}
                    {m.content && (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                    )}
                    <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${isOwn ? "text-white/70" : "text-washi-50/40"}`}>
                      <span>{formatTime(m.created_at)}</span>
                      {getTicks(m)}
                    </div>
                  </div>
                  {(canMuteSender || canDelete) && (
                    <div className={`mt-0.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {canMuteSender && sender && (
                        <button
                          onClick={() => onMute(sender)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-washi-50/40 hover:text-kin"
                        >
                          Mute
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => remove(m.id)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-washi-50/40 hover:text-torii-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-washi-50/10 bg-ink/60 p-2 backdrop-blur md:p-3">
        {imageFile && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-washi-50/5 px-3 py-1.5 text-xs">
            <span className="text-matcha">?? {imageFile.name}</span>
            <button type="button" onClick={() => setImageFile(null)} className="text-washi-50/60 hover:text-torii-400">
              ?
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="mb-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-washi-50/70 hover:bg-washi-50/5 hover:text-washi-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={!currentProfile || sending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 5 * 1024 * 1024) setError("Images must be 5 MB or smaller.");
                else if (file) {
                  setError("");
                  setImageFile(file);
                }
                e.currentTarget.value = "";
              }}
            />
          </label>
          <input
            ref={inputRef}
            className="flex-1 rounded-full border border-washi-50/10 bg-washi-50/5 px-4 py-2 text-sm text-washi-100 placeholder:text-washi-50/40 focus:border-torii/50 focus:outline-none focus:ring-1 focus:ring-torii/30 disabled:opacity-50"
            placeholder={currentProfile ? "Type a message..." : "Log in to join the chat"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!currentProfile || sending}
          />
          <button
            type="submit"
            disabled={!currentProfile || sending || (!draft.trim() && !imageFile)}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-torii-500 to-torii-600 text-white shadow-lg transition-all hover:shadow-torii/30 disabled:opacity-40 disabled:shadow-none"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 rotate-90">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
      {error && (
        <p className="border-t border-torii/30 bg-torii/10 px-4 py-2 text-xs text-sakura-200">
          {error}
        </p>
      )}
    </div>
  );
}
