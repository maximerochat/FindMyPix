import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: Request) {
	const session = await auth();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Get the raw JWT token
	const token = await getToken({
		req: request as any,
		raw: true,
		secret: process.env.NEXTAUTH_SECRET
	});

	return NextResponse.json({
		token: token,
		user: session.user
	});
}
