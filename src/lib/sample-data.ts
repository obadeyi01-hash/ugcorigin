import type { Creator } from "@/components/marketplace/creator-card";

// The full service taxonomy lives in categories.ts; re-exported as NICHES for
// the existing call sites (onboarding, filters, brief/campaign forms).
export { CATEGORIES as NICHES } from "./categories";

// Pexels portrait (free, commercial use, model-released stock).
const img = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop`;

/**
 * Representative creator imagery for the MARKETING pages only — illustrative
 * names, niches and rate ranges. No handles (not real profiles), no ratings or
 * metrics (those are server-truth). The directory and homepage show REAL
 * creators from the database when they exist; this is the pre-launch placeholder.
 */
export const SAMPLE_CREATORS: Creator[] = [
  { name: "Yetunde A.", image: img(12447951), location: "Lagos, NG", niches: ["Fashion", "Lifestyle", "Styling"], startingRate: 60000, featured: true },
  { name: "Emeka O.", image: img(15505145), location: "Lagos, NG", niches: ["Fashion", "Lifestyle"], startingRate: 55000 },
  { name: "Ngozi E.", image: img(13417077), location: "Enugu, NG", niches: ["Food & Cooking", "Lifestyle"], startingRate: 35000 },
  { name: "Tunde B.", image: img(15135912), location: "Ibadan, NG", niches: ["Skits", "Lifestyle"], startingRate: 50000 },
  { name: "Amara I.", image: img(10375901), location: "Abuja, NG", niches: ["Fintech", "Testimonials"], startingRate: 85000, featured: true },
  { name: "Zainab K.", image: img(1757281), location: "Abuja, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 45000 },
  { name: "Chidi N.", image: img(936119), location: "Enugu, NG", niches: ["Fashion", "Lifestyle"], startingRate: 48000 },
  { name: "Obi D.", image: img(15689960), location: "Lagos, NG", niches: ["SaaS / Tech", "Testimonials"], startingRate: 95000 },
  { name: "Ifeoma U.", image: img(10476512), location: "Port Harcourt, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 40000 },
  { name: "Chisom A.", image: img(11598903), location: "Lagos, NG", niches: ["Food & Cooking", "Product Demo"], startingRate: 38000 },
];
