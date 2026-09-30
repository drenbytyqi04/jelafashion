import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mutateLocalDb, readLocalDb, type LocalUser } from "@/lib/local-db";

// Development sign-in without Supabase: the magic link carries an HMAC-signed token and
// the session is an HMAC-signed cookie. The secret lives in .data/db.json.

export const LOCAL_SESSION_COOKIE = "jf_session";
const LINK_TTL_MS = 30 * 60 * 1000;
export const SESSION_TTL_S = 30 * 24 * 60 * 60;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");

async function sign(payload: object) {
  const { secret } = await readLocalDb();
  const body = b64(JSON.stringify(payload));
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const { secret } = await readLocalDb();
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(unb64(body)) as T;
  } catch {
    return null;
  }
}

/** Admins in local development: comma-separated emails, default admin@example.com. */
function devAdmins() {
  return (process.env.JF_DEV_ADMINS ?? "admin@example.com").split(",").map((e) => e.trim().toLowerCase());
}

export const createLinkToken = (email: string) => sign({ kind: "link", email, exp: Date.now() + LINK_TTL_MS });

/** Redeems a link token: creates the user on first sign-in and returns a session value. */
export async function redeemLinkToken(token: string): Promise<string | null> {
  const payload = await verify<{ kind: string; email: string; exp: number }>(token);
  if (!payload || payload.kind !== "link" || payload.exp < Date.now()) return null;
  const email = payload.email.toLowerCase();
  const user = await mutateLocalDb((db) => {
    let u = db.users.find((x) => x.email === email);
    if (!u) {
      u = {
        id: randomUUID(),
        email,
        fullName: null,
        phone: null,
        locale: "sq",
        role: devAdmins().includes(email) ? "admin" : "customer",
        createdAt: new Date().toISOString(),
      };
      db.users.push(u);
    }
    return u;
  });
  return sign({ kind: "session", uid: user.id, exp: Date.now() + SESSION_TTL_S * 1000 });
}

export async function localSessionUser(cookieValue: string | undefined): Promise<LocalUser | null> {
  const payload = await verify<{ kind: string; uid: string; exp: number }>(cookieValue);
  if (!payload || payload.kind !== "session" || payload.exp < Date.now()) return null;
  return (await readLocalDb()).users.find((u) => u.id === payload.uid) ?? null;
}
