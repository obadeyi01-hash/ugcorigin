import { createHmac } from "node:crypto";

// A Virtual NIN is the 16-character code from the NIMC app. The raw 11-digit
// NIN is never accepted. The plaintext is kept only while a review is open.

export function identityPepper() {
  return process.env.IDENTITY_TOKEN_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || "ugcorigin-identity-token";
}

export function identityTokenHash(token: string, pepper = identityPepper()) {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

/** A 16-character Virtual NIN, or a NINAuth Share Code. Never the raw 11-digit NIN. */
export function parseVirtualNin(raw: string): { token?: string; error?: string } {
  const token = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (/^\d{11}$/.test(token)) {
    return { error: "Enter the Virtual NIN or Share Code from the NIMC app, not the 11-digit NIN." };
  }
  if (/^[A-Z0-9]{16}$/.test(token) || /^[A-Z0-9]{6}$/.test(token)) return { token };
  return { error: "Paste the 16-character Virtual NIN, or the Share Code from the NINAuth app." };
}
