import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Next.js 16 renamed middleware → proxy. This runs before /console routes.
// If there's no valid session token, the user is redirected to /login.
// Public pages (/asset/[publicId], auth, /) are NOT matched, so they stay open.
export default withAuth(
  function authorized(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/console/:path*"],
};
