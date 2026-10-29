"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null, bio })
      .eq("id", profile.id);

    setBusy(false);
    if (error) setError(error.message);
    else {
      setMessage("Profile saved.");
      router.refresh();
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", profile.id);

    setBusy(false);
    if (error) setError(error.message);
    else {
      setMessage("Avatar updated.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => uploadAvatar(e.target.files?.[0])}
          />
          <span className="btn-ghost px-3 py-1.5 text-xs">Change avatar</span>
        </label>
        <span className="text-xs text-washi-50/50">
          JPG, PNG, GIF, or WebP up to 5 MB.
        </span>
      </div>

      <div>
        <label htmlFor="display_name" className="label">
          Display name
        </label>
        <input
          id="display_name"
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />
      </div>

      <div>
        <label htmlFor="bio" className="label">
          Bio
        </label>
        <textarea
          id="bio"
          className="input min-h-[100px] resize-y"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the community about yourself…"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-torii/40 bg-torii/10 px-3 py-2 text-sm text-sakura-200">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-matcha/40 bg-matcha/10 px-3 py-2 text-sm text-matcha">
          {message}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
