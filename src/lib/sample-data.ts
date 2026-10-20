import type { Creator } from "@/components/marketplace/creator-card";

// The full service taxonomy lives in categories.ts; re-exported as NICHES for
// the existing call sites (onboarding, filters, brief/campaign forms).
export { CATEGORIES as NICHES } from "./categories";

/**
 * Illustrative creators for the MARKETING pages only — fictional names, niches
 * and rate ranges with NO photos (monogram avatars render instead), so we never
 * put a fabricated name on a real person's face. No handles, no ratings/metrics.
 * The directory and homepage show REAL creators from the database when they
 * exist; this is only the pre-launch placeholder.
 */
export const SAMPLE_CREATORS: Creator[] = [
  { name: "Yetunde A.", location: "Lagos, NG", niches: ["Fashion", "Lifestyle", "Styling"], startingRate: 60000, featured: true },
  { name: "Emeka O.", location: "Lagos, NG", niches: ["Fashion", "Lifestyle"], startingRate: 55000 },
  { name: "Ngozi E.", location: "Enugu, NG", niches: ["Food & Cooking", "Lifestyle"], startingRate: 35000 },
  { name: "Tunde B.", location: "Ibadan, NG", niches: ["Skits", "Lifestyle"], startingRate: 50000 },
  { name: "Amara I.", location: "Abuja, NG", niches: ["Fintech", "Testimonials"], startingRate: 85000, featured: true },
  { name: "Zainab K.", location: "Abuja, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 45000 },
  { name: "Chidi N.", location: "Enugu, NG", niches: ["Fashion", "Lifestyle"], startingRate: 48000 },
  { name: "Obi D.", location: "Lagos, NG", niches: ["SaaS / Tech", "Testimonials"], startingRate: 95000 },
  { name: "Ifeoma U.", location: "Port Harcourt, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 40000 },
  { name: "Chisom A.", location: "Lagos, NG", niches: ["Food & Cooking", "Product Demo"], startingRate: 38000 },
];
