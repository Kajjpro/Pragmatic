import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-16rem)] flex-1 items-center justify-center bg-ink-50 p-6">
      <SignIn />
    </main>
  );
}
