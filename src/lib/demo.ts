import type {
  Board,
  ChatRoom,
  Comment,
  Message,
  Post,
  Profile,
} from "@/lib/types";

const now = Date.now();
const hoursAgo = (n: number) => new Date(now - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

/**
 * Demo mode activates automatically when Supabase env vars are missing,
 * so the UI can be previewed before a real backend is connected.
 */
export function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
export const demoProfiles: Profile[] = [
  {
    id: "demo-shogun",
    username: "shogun_hiroshi",
    display_name: "Hiroshi",
    bio: "Keeper of the realm. Ask me anything about bakufu history.",
    avatar_url: null,
    role: "shogun",
    reputation: 4200,
    created_at: daysAgo(400),
  },
  {
    id: "demo-samurai",
    username: "samurai_aiko",
    display_name: "Aiko",
    bio: "Moderator. I keep the boards clean and the chat civil.",
    avatar_url: null,
    role: "samurai",
    reputation: 2150,
    created_at: daysAgo(300),
  },
  {
    id: "demo-ronin-1",
    username: "ronin_kazuki",
    display_name: "Kazuki",
    bio: "Wandering otaku. Seasonal anime enthusiast.",
    avatar_url: null,
    role: "ronin",
    reputation: 640,
    created_at: daysAgo(120),
  },
  {
    id: "demo-ronin-2",
    username: "ronin_yuki",
    display_name: "Yuki",
    bio: "Game dev by day, retro gamer by night.",
    avatar_url: null,
    role: "ronin",
    reputation: 380,
    created_at: daysAgo(60),
  },
];

export const demoCurrentProfile: Profile = demoProfiles[0];

export function getDemoProfileByUsername(username: string): Profile | undefined {
  return demoProfiles.find((p) => p.username === username);
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------
export const demoBoards: Board[] = [
  { id: "demo-board-anime", slug: "anime", name: "Anime", description: "Seasonal shows, classics, and manga talk.", icon: "🌸", created_at: daysAgo(500) },
  { id: "demo-board-tech", slug: "tech", name: "Tech", description: "Programming, hardware, and the cutting edge.", icon: "⚙️", created_at: daysAgo(500) },
  { id: "demo-board-gaming", slug: "gaming", name: "Gaming", description: "Video games, retro to next-gen.", icon: "🎮", created_at: daysAgo(500) },
  { id: "demo-board-culture", slug: "culture", name: "Japanese Culture", description: "History, language, food, and traditions.", icon: "⛩️", created_at: daysAgo(500) },
];

export function getDemoBoardBySlug(slug: string): Board | undefined {
  return demoBoards.find((b) => b.slug === slug);
}

// ---------------------------------------------------------------------------
// Chat rooms
// ---------------------------------------------------------------------------
export const demoRooms: ChatRoom[] = [
  { id: "demo-room-general", slug: "general", name: "General", description: "Casual conversation for everyone.", created_at: daysAgo(500) },
  { id: "demo-room-anime", slug: "anime-night", name: "Anime Night", description: "Live discussion of currently airing anime.", created_at: daysAgo(500) },
  { id: "demo-room-tech", slug: "tech-dojo", name: "Tech Dojo", description: "Code, gadgets, and help.", created_at: daysAgo(500) },
  { id: "demo-room-gaming", slug: "gaming", name: "Gaming", description: "LFG, clips, and hype.", created_at: daysAgo(500) },
  { id: "demo-room-culture", slug: "culture-tea", name: "Culture & Tea", description: "Language, history, and traditions.", created_at: daysAgo(500) },
];

export function getDemoRoomBySlug(slug: string): ChatRoom | undefined {
  return demoRooms.find((r) => r.slug === slug);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
const [shogun, samurai, kazuki, yuki] = demoProfiles;
const [animeBoard, techBoard, gamingBoard, cultureBoard] = demoBoards;

export const demoPosts: Post[] = [
  {
    id: "demo-post-1",
    board_id: animeBoard.id,
    author_id: kazuki.id,
    title: "Spring season first impressions — what's actually worth watching?",
    content:
      "Three episodes into the new season and I'm already overwhelmed. My standouts so far: the sakuga-heavy action show, one surprisingly heartfelt slice-of-life, and a mystery that isn't playing its cards too early.\n\nWhat's on everyone's watch list? Drop your underrated picks so I don't miss anything good.",
    tags: ["anime", "seasonal", "discussion"],
    vote_score: 42,
    created_at: hoursAgo(5),
    board: animeBoard,
    author: kazuki,
    user_vote: 1,
  },
  {
    id: "demo-post-2",
    board_id: cultureBoard.id,
    author_id: shogun.id,
    title: "The torii gate: why it marks the boundary of the sacred",
    content:
      "A torii is more than a striking landmark. It marks the transition from the everyday world to a sacred space. Passing beneath one is meant to be a small act of purification.\n\nFun detail: the classic two-pillar form is called myōjin style, but the simpler shinmei style (no secondary beam) predates it. Next time you see one, look for the plaque — the gakuzuka often names the shrine.",
    tags: ["history", "shrines", "architecture"],
    vote_score: 88,
    created_at: hoursAgo(26),
    board: cultureBoard,
    author: shogun,
    user_vote: null,
  },
  {
    id: "demo-post-3",
    board_id: techBoard.id,
    author_id: yuki.id,
    title: "I built a kana flashcard app with Next.js + Supabase",
    content:
      "Spent the weekend building a hiragana/katakana flashcard app. Supabase Auth for accounts, Postgres for progress tracking, and Realtime to sync streak across devices.\n\nHonestly the trickiest part was spaced repetition logic, not the stack. Happy to share the schema if anyone's curious.",
    tags: ["webdev", "japanese", "supabase"],
    vote_score: 31,
    created_at: hoursAgo(50),
    board: techBoard,
    author: yuki,
    user_vote: null,
  },
  {
    id: "demo-post-4",
    board_id: gamingBoard.id,
    author_id: samurai.id,
    title: "Sekiro boss difficulty ranking (mild spoilers)",
    content:
      "After four playthroughs, here's my honest ranking. Genichiro is a skill check, not a wall — once he clicks, he clicks. The real gatekeeper is a certain ape, and the final boss is still the most satisfying parry dance in gaming.\n\nKeep it civil in the replies; difficulty is personal.",
    tags: ["sekiro", "ranking", "fromsoftware"],
    vote_score: 57,
    created_at: hoursAgo(72),
    board: gamingBoard,
    author: samurai,
    user_vote: -1,
  },
  {
    id: "demo-post-5",
    board_id: animeBoard.id,
    author_id: yuki.id,
    title: "Recommendations for someone new to slice-of-life",
    content:
      "A friend wants to get into slice-of-life and asked where to start. I'm thinking: a cozy café show for the vibes, a music-club show for the ensemble cast, and a camping show for peak relaxation.\n\nWhat would you add for a newcomer?",
    tags: ["anime", "recs", "slice-of-life"],
    vote_score: 19,
    created_at: daysAgo(2),
    board: animeBoard,
    author: yuki,
    user_vote: null,
  },
  {
    id: "demo-post-6",
    board_id: techBoard.id,
    author_id: kazuki.id,
    title: "Best keyboard layout for typing Japanese on Linux?",
    content:
      "I'm setting up a fresh Linux box and want a sane Japanese input method. ibus-mozc vs fcitx5 — which is less painful in 2026? I mostly write code plus occasional Japanese notes.",
    tags: ["hardware", "linux", "ime"],
    vote_score: 12,
    created_at: daysAgo(3),
    board: techBoard,
    author: kazuki,
    user_vote: null,
  },
];

export function getDemoPostById(id: string): Post | undefined {
  return demoPosts.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export const demoComments: Comment[] = [
  {
    id: "demo-comment-1",
    post_id: "demo-post-2",
    author_id: samurai.id,
    content: "Great write-up. I never knew the shinmei style was the older one.",
    created_at: hoursAgo(20),
    author: samurai,
  },
  {
    id: "demo-comment-2",
    post_id: "demo-post-2",
    author_id: kazuki.id,
    content: "The purification detail is fascinating. Does the gate orientation toward the sun matter too?",
    created_at: hoursAgo(18),
    author: kazuki,
  },
  {
    id: "demo-comment-3",
    post_id: "demo-post-1",
    author_id: yuki.id,
    content: "The mystery show is my pick too — best pacing in a while.",
    created_at: hoursAgo(3),
    author: yuki,
  },
];

export function getDemoCommentsByPostId(postId: string): Comment[] {
  return demoComments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------
export const demoMessages: Message[] = [
  { id: "demo-msg-1", room_id: "demo-room-general", sender_id: shogun.id, content: "Welcome to the general room, everyone. Keep it kind.", created_at: hoursAgo(30), sender: shogun },
  { id: "demo-msg-2", room_id: "demo-room-general", sender_id: kazuki.id, content: "Morning! Just finished the new episode — no spoilers, but wow.", created_at: hoursAgo(4), sender: kazuki },
  { id: "demo-msg-3", room_id: "demo-room-general", sender_id: yuki.id, content: "I'm holding off until the season finishes so I can binge it.", created_at: hoursAgo(3), sender: yuki },
  { id: "demo-msg-4", room_id: "demo-room-general", sender_id: samurai.id, content: "Reminder: tag spoilers in the anime room, not here. 🙏", created_at: hoursAgo(2), sender: samurai },
  { id: "demo-msg-5", room_id: "demo-room-general", sender_id: kazuki.id, content: "Fair. Moving my theories over there now.", created_at: hoursAgo(1), sender: kazuki },
  { id: "demo-msg-6", room_id: "demo-room-anime", sender_id: kazuki.id, content: "Episode 3 theory thread is open — bring your best guesses.", created_at: hoursAgo(1), sender: kazuki },
  { id: "demo-msg-7", room_id: "demo-room-anime", sender_id: yuki.id, content: "Calling it now: the quiet kid is the antagonist.", created_at: hoursAgo(1), sender: yuki },
];

export function getDemoMessagesByRoomId(roomId: string): Message[] {
  return demoMessages.filter((m) => m.room_id === roomId);
}
