import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getRecentSearches, saveRecentSearch } from "@/services/UserService";

/**
 * GET /api/account/recent-searches
 * Returns the authenticated user's recent search queries.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const searches = await getRecentSearches(session.user.id);
    return Response.json({ searches });
  } catch (err) {
    console.error("[GET /api/account/recent-searches]", err);
    return Response.json({ error: "Failed to fetch recent searches." }, { status: 500 });
  }
}

/**
 * POST /api/account/recent-searches
 * Body: { query: string }
 * Saves a search query to the user's recent searches.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let query: string;
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!query.trim()) {
    return Response.json({ error: "query is required." }, { status: 400 });
  }

  try {
    await saveRecentSearch(session.user.id, query);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[POST /api/account/recent-searches]", err);
    return Response.json({ error: "Failed to save search." }, { status: 500 });
  }
}
