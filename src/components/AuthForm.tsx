"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim() || undefined,
            display_name: username.trim() || undefined,
          },
        },
      });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account, then log in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
      <div>
        <h2 className="heading-display text-2xl">
          {isSignup ? "Join the clan" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-washi-50/60">
          {isSignup
            ? "Sign up as a Ronin and earn your place."
            : "Log in to return to the community."}
        </p>
      </div>

      {isSignup && (
        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            className="input"
            placeholder="e.g. wandering_samurai"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          className="input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-torii/40 bg-torii/10 px-3 py-2 text-sm text-sakura-200">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-lg border border-matcha/40 bg-matcha/10 px-3 py-2 text-sm text-matcha">
          {info}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? "Please wait…"
          : isSignup
            ? "Create account"
            : "Log in"}
      </button>
    </form>
  );
}
