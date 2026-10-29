"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-display text-6xl text-torii">残念</div>
      <h1 className="heading-display mt-4 text-2xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-washi-50/60">
        {error.message || "An unexpected error occurred."}
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
