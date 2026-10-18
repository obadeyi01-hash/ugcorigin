import type { Creator } from "@/components/marketplace/creator-card";

export const NICHES = [
  "Beauty & Skincare",
  "Fintech",
  "Food & Cooking",
  "Fashion",
  "SaaS / Tech",
  "Lifestyle",
  "Unboxing",
  "Testimonials",
  "Product Demo",
  "Skits",
];

// Pexels portrait (free, commercial use). Real African/Nigerian creators.
const img = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop`;

/**
 * Representative creator imagery for the MARKETING pages only, real African
 * photography, illustrative niches and rate ranges. No handles (not real
 * profiles), no ratings/metrics (those are server-truth). The directory shows
 * real creators from the database, not these.
 */
export const SAMPLE_CREATORS: Creator[] = [
  { name: "Yetunde A.", image: img(12447951), location: "Lagos, NG", niches: ["Fashion", "Lifestyle", "Styling"], startingRate: 60000, featured: true },
  { name: "Emeka O.", image: img(15505145), location: "Lagos, NG", niches: ["Fashion", "Lifestyle"], startingRate: 55000 },
  { name: "Ngozi E.", image: img(13417077), location: "Enugu, NG", niches: ["Food & Cooking", "Lifestyle"], startingRate: 35000 },
  { name: "Tunde B.", image: img(15135912), location: "Ibadan, NG", niches: ["Skits", "Lifestyle"], startingRate: 50000 },
  { name: "Amara I.", image: img(10375901), location: "Abuja, NG", niches: ["Fintech", "Testimonials"], startingRate: 85000, featured: true },
  { name: "Zainab K.", image: img(1757281), location: "Abuja, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 45000 },
  { name: "Chidi N.", image: img(16001703), location: "Enugu, NG", niches: ["Fashion", "Lifestyle"], startingRate: 48000 },
  { name: "Obi D.", image: img(15689960), location: "Lagos, NG", niches: ["SaaS / Tech", "Testimonials"], startingRate: 95000 },
  { name: "Ifeoma U.", image: img(10476512), location: "Port Harcourt, NG", niches: ["Beauty & Skincare", "Unboxing"], startingRate: 40000 },
  { name: "Chisom A.", image: img(11598903), location: "Lagos, NG", niches: ["Food & Cooking", "Product Demo"], startingRate: 38000 },
];
