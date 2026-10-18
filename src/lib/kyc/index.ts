// KYC / identity verification, provider abstraction. SERVER ONLY.
// Primary: Smile ID. Backup: Dojah. Both need accounts + API keys (not yet set).
// When no provider is configured, the gate shows "identity not connected" and a
// creator cannot go live, the gate stays airtight. Complete the adapter bodies
// against each provider's docs once credentials exist.

export type KycInitiation =
  | { configured: true; url?: string; reference: string }
  | { configured: false };

export interface KycProvider {
  name: "smileid" | "dojah";
  /** Start a hosted identity+liveness check for this user; returns a redirect URL + reference. */
  initiate(userId: string): Promise<KycInitiation>;
}

export function getKycProvider(): KycProvider | null {
  if (process.env.SMILE_ID_PARTNER_ID && process.env.SMILE_ID_API_KEY) return smileId();
  if (process.env.DOJAH_APP_ID && process.env.DOJAH_API_KEY) return dojah();
  return null;
}

export function kycConfigured() {
  return !!getKycProvider();
}

// --- Smile ID (primary) ------------------------------------------------------
function smileId(): KycProvider {
  return {
    name: "smileid",
    async initiate(): Promise<KycInitiation> {
      // TODO (needs SMILE_ID creds): create a Smile Links / hosted session and
      // return its URL + reference. Verify payload + signature against Smile ID docs.
      // Result arrives via the webhook at /api/kyc/webhook which flips
      // identity_verified via the service role.
      throw new Error("Smile ID integration not yet completed, add credentials and finish the adapter.");
    },
  };
}

// --- Dojah (backup) ----------------------------------------------------------
function dojah(): KycProvider {
  return {
    name: "dojah",
    async initiate(): Promise<KycInitiation> {
      // TODO (needs DOJAH creds): create a Dojah verification session and return
      // its URL + reference; handle the result via the webhook.
      throw new Error("Dojah integration not yet completed, add credentials and finish the adapter.");
    },
  };
}
