import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles email-verification links (token_hash + type) sent by Supabase.
 * Configure this URL in Supabase -> Auth -> URL Configuration ->
 * "Confirm email" redirect: http://localhost:3000/auth/confirm
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectTo = request.nextUrl.clone();
      redirectTo.pathname = next;
      redirectTo.searchParams.delete("token_hash");
      redirectTo.searchParams.delete("type");
      return NextResponse.redirect(redirectTo);
    }
  }

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/login";
  redirectTo.search = "";
  return NextResponse.redirect(redirectTo);
}
