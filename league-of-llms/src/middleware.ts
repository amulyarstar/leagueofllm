import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Rate-limit mutating API routes by IP before anything else runs.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const { allowed, remaining, resetMs } = await checkRateLimit(ip, request.nextUrl.pathname);

    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down and try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(resetMs / 1000).toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
