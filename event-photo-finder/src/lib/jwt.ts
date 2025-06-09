import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getAuthToken(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });
  return token;
}

export function createBearerToken(token: any): string {
  // You can create a custom JWT or use the existing one
  // For simplicity, we'll extract the raw JWT from the request
  return token.jti || ""; // or implement custom JWT creation
}
