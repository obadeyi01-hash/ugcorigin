import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  // Scope "local" revokes only THIS device's session. The default ("global")
  // revokes every refresh token for the user, which signed them out of all
  // their other devices too — not what signing out of one browser should do.
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
