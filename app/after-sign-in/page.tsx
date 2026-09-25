import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AfterSignInPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    null;
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

  await prisma.user.upsert({
    where: { clerkId: userId },
    update: { name, email },
    create: { clerkId: userId, name, email },
  });

  redirect("/");
}
