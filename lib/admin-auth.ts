import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
export const ADMIN_COOKIE = "studio_case_admin";
export function getAdminPassword() { return process.env.CASE_ADMIN_PASSWORD && process.env.CASE_ADMIN_SECRET ? process.env.CASE_ADMIN_PASSWORD : null; }
export function getSessionToken() { if (!getAdminPassword()) throw new Error("Admin credentials are not configured."); return createHmac("sha256",process.env.CASE_ADMIN_SECRET!).update("case-editor").digest("hex"); }
export function isValidSession(token?:string) { if (!token || !getAdminPassword()) return false; const expected=Buffer.from(getSessionToken()); const received=Buffer.from(token); return expected.length===received.length && timingSafeEqual(expected,received); }
export function isAdminRequest(request:NextRequest) { return isValidSession(request.cookies.get(ADMIN_COOKIE)?.value); }
