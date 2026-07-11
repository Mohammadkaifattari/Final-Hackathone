import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// App Router route handler for NextAuth v4.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
