import { createClient } from "@/lib/supabase/server";
import { demoCurrentProfile, isDemoMode } from "@/lib/demo";
import type { Profile } from "@/lib/types";

export async function getCurrentUser() {
  if (isDemoMode()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isDemoMode()) return demoCurrentProfile;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}
