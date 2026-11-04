import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // 1. Check custom AMVI session cookie (password/admin)
  const amviSession = await getCurrentUserSession();
  if (amviSession) {
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        email: amviSession.email,
        role: amviSession.role,
        name: amviSession.name || (amviSession.role === "admin" ? "Admin" : "Collector"),
      },
    });
  }

  // 2. Check Supabase Auth session (OAuth / Phone / Email)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const isAdmin = user.email === "admin@gmail.com";
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          email: user.email || "",
          role: isAdmin ? "admin" : "user",
          name: user.user_metadata?.full_name || (isAdmin ? "Admin" : "Collector"),
        },
      });
    }
  } catch (error) {
    console.error("[Session Route Error]:", error);
  }

  return NextResponse.json({
    isAuthenticated: false,
    user: null,
  });
}
