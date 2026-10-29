import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { demoProfiles, isDemoMode } from "@/lib/demo";
import { canBan, canManageRoles, canModerate, canMute } from "@/lib/roles";
import UserModerationRow from "@/components/UserModerationRow";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canModerate(profile.role)) redirect("/");

  let profiles: Profile[] = [];
  const bannedIds = new Set<string>();
  const mutedIds = new Set<string>();

  if (isDemoMode()) {
    profiles = demoProfiles;
    // Illustrate both moderation states in the demo.
    mutedIds.add("demo-ronin-1");
    bannedIds.add("demo-ronin-2");
  } else {
    const supabase = createClient();
    const [{ data: p }, { data: mods }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("moderation")
        .select("target_id, action, expires_at")
        .in("action", ["ban", "mute"]),
    ]);
    profiles = (p ?? []) as Profile[];

    const now = Date.now();
    for (const m of mods ?? []) {
      const active = !m.expires_at || new Date(m.expires_at).getTime() > now;
      if (!active) continue;
      if (m.action === "ban") bannedIds.add(m.target_id);
      else if (m.action === "mute") mutedIds.add(m.target_id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-3xl">Shogun&apos;s hall</h1>
        <p className="mt-1 text-sm text-washi-50/60">
          Assign roles and moderate members. Shogun can ban and promote;
          Samurai can mute.
        </p>
      </div>

      <div className="space-y-3">
        {profiles.map((p) => (
          <UserModerationRow
            key={p.id}
            profile={p}
            isBanned={bannedIds.has(p.id)}
            isMuted={mutedIds.has(p.id)}
            canBan={canBan(profile.role)}
            canMute={canMute(profile.role)}
            canManageRoles={canManageRoles(profile.role)}
          />
        ))}
      </div>
    </div>
  );
}
