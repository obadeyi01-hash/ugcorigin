import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/rbac";

/**
 * A viewer's primary role for the user-facing app. `admin` is reported
 * separately via `isAdmin` (admins keep whatever brand/creator profile they
 * hold); `activeRole` only resolves to "admin" for an admin with no profile.
 */
export type ActiveRole = "brand" | "creator" | "admin" | "guest";

export type Viewer = {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  isBrand: boolean;
  isCreator: boolean;
  /** Holds both a brand and a creator profile on the same account. */
  hasBoth: boolean;
  /** Single resolved role for display defaults (menu subtitle, redirects). */
  activeRole: ActiveRole;
  /**
   * Whether to surface brand-only actions (Post a brief, Make an offer, Fund
   * escrow, Create a campaign). Hidden only from creator-only accounts; guests
   * still see them as acquisition CTAs.
   */
  showBrandCtas: boolean;
  /** Whether to surface creator-only actions (Apply to a brief, Submit to a campaign). */
  showCreatorCtas: boolean;
  /** Brand profile exists and a reviewer has approved it. */
  brandVerified: boolean;
  /** Creator profile exists, is live, and is not suspended. */
  creatorLive: boolean;
};

const GUEST: Viewer = {
  userId: null,
  email: null,
  isAdmin: false,
  isBrand: false,
  isCreator: false,
  hasBoth: false,
  activeRole: "guest",
  showBrandCtas: true,
  showCreatorCtas: true,
  brandVerified: false,
  creatorLive: false,
};

/**
 * Resolve the signed-in viewer's role from their brand/creator profiles and
 * admin membership. An account may hold BOTH a brand and a creator profile
 * (a supported, founder-designed state — see the dashboard cross-sell); in
 * that case it keeps both capabilities and `hasBoth` is true. Visibility is
 * capability-based: a creator-only account never sees brand actions and a
 * brand-only account never sees creator actions.
 */
export async function getViewer(): Promise<Viewer> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return GUEST;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return GUEST;

  const [{ data: creator }, { data: brand }, adminCtx] = await Promise.all([
    supabase.from("creator_profiles").select("id, is_live, suspended").eq("id", user.id).maybeSingle(),
    supabase.from("brand_profiles").select("id, verification_status").eq("id", user.id).maybeSingle(),
    getAdminContext(),
  ]);

  const isCreator = !!creator;
  const isBrand = !!brand;
  const isAdmin = !!adminCtx;
  const hasBoth = isCreator && isBrand;

  // Profile roles win for the marketplace context; an admin with no profile
  // acts as "admin". A user with neither profile is still in onboarding.
  const activeRole: ActiveRole = isCreator ? "creator" : isBrand ? "brand" : isAdmin ? "admin" : "guest";

  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin,
    isBrand,
    isCreator,
    hasBoth,
    activeRole,
    // Hide a role's actions only from an account that exclusively holds the
    // other user-side role. Admins and dual accounts see both.
    showBrandCtas: !(isCreator && !isBrand) || isAdmin,
    showCreatorCtas: !(isBrand && !isCreator) || isAdmin,
    brandVerified: brand?.verification_status === "verified",
    creatorLive: !!creator?.is_live && !creator?.suspended,
  };
}
