"use server";

import { cookies } from "next/headers";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AUTH_COOKIE_NAME,
  type AuthUserSession,
} from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LoginResult {
  success: boolean;
  role?: "admin" | "user";
  message?: string;
}

/**
 * Handles password-based authentication for the administrative portal
 * and demo accounts (such as admin@gmail.com / admin@123).
 */
export async function loginWithPasswordAction(
  formData: FormData
): Promise<LoginResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Please enter both email and password." };
  }

  // 1. Check Root Administrator Credentials
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    const sessionPayload: AuthUserSession = {
      email: ADMIN_EMAIL,
      role: "admin",
      name: "Curatorial Director",
    };

    cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      success: true,
      role: "admin",
    };
  }

  // 2. Fallback to Supabase Auth for standard registered users
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      };
    }

    const cookieStore = await cookies();
    const isUserAdmin = data.user.email === ADMIN_EMAIL;
    const sessionPayload: AuthUserSession = {
      email: data.user.email || email,
      role: isUserAdmin ? "admin" : "user",
      name: data.user.user_metadata?.full_name || "Collector",
    };

    cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      role: sessionPayload.role,
    };
  } catch (error) {
    console.error("[Login Action Error]:", error);
    return {
      success: false,
      message: "An unexpected error occurred during authentication.",
    };
  }
}

/**
 * Signs the collector or admin out by clearing the session cookie.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Helper to inspect the current logged in session from server actions/components.
 */
export async function getCurrentUserSession(): Promise<AuthUserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as AuthUserSession;
  } catch {
    return null;
  }
}
