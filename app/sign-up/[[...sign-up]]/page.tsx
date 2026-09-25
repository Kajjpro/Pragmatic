import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-16rem)] flex-1 items-center justify-center bg-parliament-50/40 p-6">
      <SignUp />
    </main>
  );
}
