import { type NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken, updateDigestPreferences } from "@/services/UserService";

/**
 * GET /api/account/unsubscribe?token=<JWT>
 *
 * One-click unsubscribe from the weekly digest. No sign-in required.
 * Verifies the JWT, sets digestEnabled=false, redirects to /account/unsubscribed.
 *
 * Returns 400 with a friendly message if the token is missing, invalid, or expired.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.json(
      { error: "Missing unsubscribe token." },
      { status: 400 }
    );
  }

  const payload = await verifyUnsubscribeToken(token);

  if (!payload) {
    return Response.json(
      {
        error:
          "This unsubscribe link has expired or is invalid. " +
          "You can manage your email preferences from your account settings.",
      },
      { status: 400 }
    );
  }

  await updateDigestPreferences(payload.userId, false);

  return NextResponse.redirect(new URL("/account/unsubscribed", request.url));
}
