import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `scrypt$${salt}$${key}`;
}

export function verifyPassword(password: string, hash: string) {
  const [algorithm, salt, storedKey] = hash.split("$");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const candidate = Buffer.from(
    scryptSync(password, salt, KEY_LENGTH).toString("hex"),
    "hex"
  );
  const stored = Buffer.from(storedKey, "hex");

  if (candidate.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(candidate, stored);
}
