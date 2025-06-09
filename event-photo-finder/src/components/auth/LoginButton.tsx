"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
    </div>
  );
}
