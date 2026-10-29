export type UserRole = \"shogun\" | \"samurai\" | \"ronin\";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  reputation: number;
  created_at: string;
}

export interface Board {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  board_id: string;
  author_id: string;
  title: string;
  content: string | null;
  tags: string[];
  vote_score: number;
  created_at: string;
  author?: Profile;
  board?: Board;
  user_vote?: number | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface ChatRoom {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  sender?: Profile;
  read_by?: string[];
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface Moderation {
  id: string;
  target_id: string;
  actor_id: string;
  action: \"ban\" | \"unban\" | \"mute\" | \"unmute\";
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}
