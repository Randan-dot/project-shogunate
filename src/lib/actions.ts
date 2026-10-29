"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canBan, canModerate, canMute, isShogun } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

async function requireProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  return { supabase, user, profile };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createPost(formData: FormData) {
  const { supabase, user } = await requireProfile();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const boardId = String(formData.get("board_id") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!title) throw new Error("Title is required");
  if (!boardId) throw new Error("Please choose a board");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      board_id: boardId,
      author_id: user.id,
      title,
      content: content || null,
      tags,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/boards");
  redirect(`/posts/${post.id}`);
}

export async function deletePost(postId: string) {
  const { supabase, user, profile } = await requireProfile();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  if (!post) throw new Error("Post not found");

  if (post.author_id !== user.id && !canModerate(profile.role)) {
    throw new Error("Not authorized");
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/boards");
  redirect("/boards");
}

export async function setRole(targetId: string, role: UserRole) {
  const { supabase, profile } = await requireProfile();
  if (!isShogun(profile.role)) throw new Error("Only a Shogun can assign roles");
  if (role === "shogun") throw new Error("Cannot promote to Shogun from here");
  if (targetId === profile.id) throw new Error("You cannot change your own role");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", targetId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function banUser(targetId: string, reason?: string) {
  const { supabase, profile } = await requireProfile();
  if (!canBan(profile.role)) throw new Error("Only a Shogun can ban members");

  await supabase.from("moderation").delete().eq("target_id", targetId).eq("action", "ban");
  const { error } = await supabase.from("moderation").insert({
    target_id: targetId,
    actor_id: profile.id,
    action: "ban",
    reason: reason ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function unbanUser(targetId: string) {
  const { supabase, profile } = await requireProfile();
  if (!canBan(profile.role)) throw new Error("Only a Shogun can unban members");

  await supabase.from("moderation").delete().eq("target_id", targetId).eq("action", "ban");
  await supabase.from("moderation").insert({
    target_id: targetId,
    actor_id: profile.id,
    action: "unban",
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function muteUser(targetId: string, reason?: string) {
  const { supabase, profile } = await requireProfile();
  if (!canMute(profile.role)) throw new Error("Only a Samurai or Shogun can mute members");

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetId)
    .single();
  if (target && (target.role === "shogun" || target.role === "samurai")) {
    throw new Error("Cannot mute a moderator");
  }

  await supabase.from("moderation").delete().eq("target_id", targetId).eq("action", "mute");
  const { error } = await supabase.from("moderation").insert({
    target_id: targetId,
    actor_id: profile.id,
    action: "mute",
    reason: reason ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/chat");
}

export async function unmuteUser(targetId: string) {
  const { supabase, profile } = await requireProfile();
  if (!canMute(profile.role)) throw new Error("Only a Samurai or Shogun can unmute members");

  await supabase.from("moderation").delete().eq("target_id", targetId).eq("action", "mute");
  await supabase.from("moderation").insert({
    target_id: targetId,
    actor_id: profile.id,
    action: "unmute",
  });

  revalidatePath("/admin");
  revalidatePath("/chat");
}
