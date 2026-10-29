import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import ProfileForm from "@/components/ProfileForm";
import { ROLE_DESCRIPTIONS } from "@/lib/roles";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card flex items-center gap-5 p-6">
        <Avatar profile={profile} size={76} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="heading-display text-2xl">
              {profile.display_name || profile.username}
            </h1>
            <RoleBadge role={profile.role} />
          </div>
          <div className="text-sm text-washi-50/50">@{profile.username}</div>
          <p className="mt-1 text-sm text-washi-100/70">
            {ROLE_DESCRIPTIONS[profile.role]}
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
