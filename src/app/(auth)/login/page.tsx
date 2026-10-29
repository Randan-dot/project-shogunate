import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-washi-50/60">
          New here?{" "}
          <Link href="/signup" className="text-torii-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
