import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/shell/logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <h1 className="sr-only">Нэвтрэх</h1>
        <SignIn fallbackRedirectUrl="/after-sign-in" />
      </main>
    </div>
  );
}
