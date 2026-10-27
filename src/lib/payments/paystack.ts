// Paystack integration, SERVER ONLY (uses the secret key). Never import client-side.
import crypto from "crypto";

const BASE = "https://api.paystack.co";

export function paystackConfigured() {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export type Bank = { name: string; code: string };

/** List Nigerian banks (code + name) for the bank picker. */
export async function listBanks(country = "nigeria"): Promise<Bank[]> {
  if (!paystackConfigured()) return [];
  const res = await fetch(`${BASE}/bank?country=${country}&perPage=100`, {
    headers: headers(),
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  const json = await res.json();
  if (!json?.status) return [];
  return (json.data as Bank[]).map((b) => ({ name: b.name, code: b.code }));
}

export type ResolvedAccount = { accountName: string; accountNumber: string };

/** Verify a bank account by resolving the account name (free Paystack endpoint). */
export async function resolveAccount(
  accountNumber: string,
  bankCode: string,
): Promise<ResolvedAccount> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const res = await fetch(
    `${BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: headers(), cache: "no-store" },
  );
  const json = await res.json();
  if (!json?.status) {
    throw new Error(json?.message || "Could not verify that account.");
  }
  return {
    accountName: json.data.account_name as string,
    accountNumber: json.data.account_number as string,
  };
}

/** Initialize a Paystack checkout. amountNaira is in Naira (converted to kobo here). */
export async function initTransaction(args: {
  email: string;
  amountNaira: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}): Promise<{ authorizationUrl: string; reference: string }> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amountNaira * 100), // kobo
      reference: args.reference,
      metadata: args.metadata,
      callback_url: args.callbackUrl,
    }),
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Could not start payment.");
  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
}

export type VerifiedTransaction = {
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  amountNaira: number; // converted from kobo
  currency: string; // 'NGN'
  reference: string;
  metadata: Record<string, unknown>;
};

/**
 * Re-verify a transaction server-side against Paystack. Never grant value on a
 * webhook body alone: this confirms the charge actually succeeded and how much
 * was really paid, in the right currency. Throws on a network/API error (so the
 * caller can let Paystack retry).
 */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Could not verify transaction.");
  const d = json.data;
  return {
    status: d.status as string,
    amountNaira: Math.round((d.amount as number) / 100),
    currency: d.currency as string,
    reference: d.reference as string,
    metadata: (d.metadata ?? {}) as Record<string, unknown>,
  };
}

/** Create a transfer recipient (NUBAN) for creator payouts; returns recipient_code. */
export async function createTransferRecipient(args: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<string> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const res = await fetch(`${BASE}/transferrecipient`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({
      type: "nuban",
      name: args.name,
      account_number: args.accountNumber,
      bank_code: args.bankCode,
      currency: "NGN",
    }),
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Could not create payout recipient.");
  return json.data.recipient_code as string;
}

/** Initiate a transfer (payout) from the Paystack balance to a recipient. */
export async function initiateTransfer(args: {
  amountNaira: number;
  recipientCode: string;
  reason?: string;
  reference?: string;
}): Promise<{ status: string; reference: string | null }> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const res = await fetch(`${BASE}/transfer`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(args.amountNaira * 100),
      recipient: args.recipientCode,
      reason: args.reason,
      reference: args.reference,
    }),
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Could not start payout.");
  return { status: json.data.status as string, reference: json.data.reference ?? null };
}

/**
 * Refund a charge back to the brand via Paystack. `reference` is the original
 * transaction reference (escrow_transactions.provider_ref). Amount optional —
 * omit for a full refund. Returns the refund status Paystack reports.
 */
export async function createRefund(args: {
  reference: string;
  amountNaira?: number;
  reason?: string;
}): Promise<{ status: string }> {
  if (!paystackConfigured()) throw new Error("Paystack is not configured.");
  const body: Record<string, unknown> = { transaction: args.reference };
  if (args.amountNaira != null) body.amount = Math.round(args.amountNaira * 100); // kobo
  if (args.reason) body.merchant_note = args.reason;
  const res = await fetch(`${BASE}/refund`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Could not start the refund.");
  return { status: (json.data?.status as string) ?? "pending" };
}

/** Verify a Paystack webhook signature (x-paystack-signature = HMAC-SHA512 of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
