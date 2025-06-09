// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken, decode } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;
const COOKIE_NAME =
	process.env.NODE_ENV === "production"
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";


export async function POST(request: NextRequest) {
	// CORS + JSON headers
	const headers = {
		"Access-Control-Allow-Origin": "http://localhost:8000",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Content-Type": "application/json",
	};

	console.log("🔍 [validate] START");
	console.log("🔑 [validate] SECRET present?", SECRET ? true : false);
	console.log("🔑 [validate] COOKIE_NAME:", COOKIE_NAME);

	console.log("📥 [validate] incoming request headers:");
	request.headers.forEach((v, k) => console.log(`   ${k}: ${v}`));

	let body: any;
	try {
		body = await request.json();
		console.log("📨 [validate] parsed body:", body);
	} catch (e) {
		console.error("❌ [validate] JSON parse error:", e);
		return NextResponse.json(
			{ valid: false, error: "Invalid JSON body" },
			{ status: 400, headers }
		);
	}

	const token = body?.token;
	console.log("🎫 [validate] received token:", token?.slice(0, 100) + "...");

	if (!token) {
		console.warn("⚠️ [validate] no token provided");
		return NextResponse.json(
			{ valid: false, error: "No token provided" },
			{ status: 400, headers }
		);
	}

	// Build a fake Request so getToken can see the token in cookies
	const fakeReq = new Request(request.url, {
		headers: {
			authorization: `Bearer ${token}`,
		},
	});
	console.log(
		"🍪 [validate] fakeReq.headers.cookie:",
		fakeReq.headers.get("cookie")
	);

	let session: any = null;
	try {
		session = await getToken({ req: fakeReq, secret: SECRET });
		console.log("✅ [validate] getToken returned:", session);
	} catch (err) {
		console.error("❌ [validate] getToken threw error:", err);
	}

	if (!session) {
		console.warn("⚠️ [validate] token invalid or expired");
		return NextResponse.json(
			{ valid: false, error: "Invalid or expired token" },
			{ status: 401, headers }
		);
	}

	const user = {
		id: session.id,
		email: session.email,
		name: session.name,
	};
	console.log("📤 [validate] success, responding with user:", user);

	return NextResponse.json({ valid: true, user }, { headers });
}

export async function POST_save(request: NextRequest) {
	// Prepare CORS headers
	const headers = {
		"Access-Control-Allow-Origin": "http://localhost:8000",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Content-Type": "application/json",
	};

	console.log("⏱ [validate] START");

	// Log incoming headers
	console.log("⏱ [validate] incoming request headers:");
	request.headers.forEach((value, key) =>
		console.log(`   ${key}: ${value}`)
	);

	let body: any;
	try {
		body = await request.json();
		console.log("⏱ [validate] body:", body);
	} catch (e) {
		console.error("⏱ [validate] failed to parse JSON body", e);
		return NextResponse.json(
			{ valid: false, error: "Invalid JSON" },
			{ status: 400, headers }
		);
	}

	const token = body.token;
	if (!token) {
		console.warn("⏱ [validate] no token in body");
		return NextResponse.json(
			{ valid: false, error: "No token provided" },
			{ status: 400, headers }
		);
	}
	const sessionToken = token;
	const decoded =
		await decode({
			token: sessionToken,
			secret: SECRET,
			salt: "authjs.session-token",
		});

	if (!decoded) {
		return NextResponse.json(
			{ valid: false, error: "Unauthorize Token" },
			{ status: 401, headers }
		);
	}

	const user = {
		id: (decoded).id,
		email: (decoded).email,
		name: (decoded).name,
	};

	console.log("⏱ [validate] success, responding with user:", user);
	return NextResponse.json({ valid: true, user }, { headers });
}

export async function OPTIONS() {
	console.log("⏱ [validate] CORS preflight (OPTIONS)");
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "http://localhost:8000",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
