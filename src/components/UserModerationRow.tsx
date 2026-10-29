"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import {
  setRole,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
} from "@/lib/actions";

export default function UserModerationRow({
  profile,
  isBanned,
  isMuted,
  canBan,
  canMute,
  canManageRoles,
}: {
  profile: Profile;
  isBanned: boolean;
  isMuted: boolean;
  canBan: boolean;
  canMute: boolean;
  canManageRoles: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  const isTopRole = profile.role === "shogun";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-washi-50/10 bg-sumi-900/60 p-3">
      <Avatar profile={profile} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-washi-100">
            {profile.display_name || profile.username}
          </span>
          <RoleBadge role={profile.role} />
          {isBanned && (
            <span className="chip border-torii/50 text-torii-400">banned</span>
          )}
          {isMuted && (
            <span className="chip border-kin/50 text-kin">muted</span>
          )}
        </div>
        <div className="text-xs text-washi-50/50">@{profile.username}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManageRoles && !isTopRole && (
          <select
            value={profile.role === "samurai" ? "samurai" : "ronin"}
            disabled={pending}
            onChange={(e) =>
              run(() =>
                setRole(
                  profile.id,
                  e.target.value as "samurai" | "ronin"
                )
              )
            }
            className="input w-auto py-1.5 text-xs"
          >
            <option value="ronin">Ronin</option>
            <option value="samurai">Samurai</option>
          </select>
        )}

        {canMute && !isTopRole && (
          isMuted ? (
            <button
              onClick={() => run(() => unmuteUser(profile.id))}
              disabled={pending}
              className="btn-ghost px-2.5 py-1.5 text-xs"
            >
              Unmute
            </button>
          ) : (
            <button
              onClick={() =>
                run(() => muteUser(profile.id, "Muted by moderator"))
              }
              disabled={pending}
              className="btn-ghost px-2.5 py-1.5 text-xs"
            >
              Mute
            </button>
          )
        )}

        {canBan && !isTopRole &&
          (isBanned ? (
            <button
              onClick={() => run(() => unbanUser(profile.id))}
              disabled={pending}
              className="btn-ghost px-2.5 py-1.5 text-xs"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={() => run(() => banUser(profile.id, "Banned by Shogun"))}
              disabled={pending}
              className="btn-ghost border-torii/40 px-2.5 py-1.5 text-xs text-torii-400 hover:border-torii hover:text-torii-400"
            >
              Ban
            </button>
          ))}
      </div>
    </div>
  );
}
