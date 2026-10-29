import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import RoleBadge from "@/components/RoleBadge";
import Avatar from "@/components/Avatar";
import ToriiGate from "@/components/ToriiGate";

export default async function Navbar() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-washi-50/10 bg-sumi-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <ToriiGate className="h-9 w-9" />
          <span className="heading-display text-lg leading-none sm:text-xl">
            Project&nbsp;Shogunate
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-washi-100 md:flex">
          <Link href="/boards" className="transition-colors hover:text-torii-400">
            Boards
          </Link>
          <Link href="/chat" className="transition-colors hover:text-torii-400">
            Chat
          </Link>
          <Link href="/posts/new" className="transition-colors hover:text-torii-400">
            New Post
          </Link>
          {profile?.role === "shogun" && (
            <Link href="/admin" className="transition-colors hover:text-torii-400">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar profile={profile} size={32} />
                <span className="hidden max-w-[9rem] truncate text-sm text-washi-100 sm:inline">
                  {profile.display_name || profile.username}
                </span>
              </Link>
              <RoleBadge role={profile.role} className="hidden sm:inline-flex" />
              <form action={signOut}>
                <button className="btn-ghost px-3 py-1.5 text-xs">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3 py-1.5 text-xs">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3 py-1.5 text-xs">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-washi-50/10 px-4 py-2 text-sm text-washi-100 md:hidden">
        <Link href="/boards" className="whitespace-nowrap hover:text-torii-400">
          Boards
        </Link>
        <Link href="/chat" className="whitespace-nowrap hover:text-torii-400">
          Chat
        </Link>
        <Link href="/posts/new" className="whitespace-nowrap hover:text-torii-400">
          New Post
        </Link>
        {profile?.role === "shogun" && (
          <Link href="/admin" className="whitespace-nowrap hover:text-torii-400">
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
