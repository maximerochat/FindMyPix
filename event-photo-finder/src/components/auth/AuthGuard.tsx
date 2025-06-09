import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = await auth();
  console.log("Here we are")
  if (!session) {
    redirect("/api/auth/signin");
  }

  return <>{children}</>;
}
