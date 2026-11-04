export const ADMIN_EMAIL = "admin@gmail.com";
export const ADMIN_PASSWORD = "admin@123";
export const AUTH_COOKIE_NAME = "amvi_auth_user";

export interface AuthUserSession {
  email: string;
  role: "admin" | "user";
  name?: string;
  phone?: string;
}
