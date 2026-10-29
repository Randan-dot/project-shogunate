import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <AuthForm mode="signup" />
        <p className="text-center text-sm text-washi-50/60">
          Already a member?{" "}
          <Link href="/login" className="text-torii-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
