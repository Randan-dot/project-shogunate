import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-display text-6xl text-torii">四〇四</div>
      <h1 className="heading-display mt-4 text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-washi-50/60">
        The path you followed has faded like cherry blossoms.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Return home
      </Link>
    </div>
  );
}
