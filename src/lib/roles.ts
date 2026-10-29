import type { UserRole } from "@/lib/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  shogun: "Shogun",
  samurai: "Samurai",
  ronin: "Ronin",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  shogun: "Admin — ban, promote, and manage everything.",
  samurai: "Moderator — mute and remove content.",
  ronin: "Member — post, vote, and chat.",
};

export function canModerate(role?: UserRole | null): boolean {
  return role === "shogun" || role === "samurai";
}

export function isShogun(role?: UserRole | null): boolean {
  return role === "shogun";
}

export function canBan(role?: UserRole | null): boolean {
  return role === "shogun";
}

export function canMute(role?: UserRole | null): boolean {
  return role === "shogun" || role === "samurai";
}

export function canManageRoles(role?: UserRole | null): boolean {
  return role === "shogun";
}
