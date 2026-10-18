// Service categories (what creators do) + regions + filter options for the
// directory. A superset of the original niches so existing creator data stays
// valid. Note: deliberately NO "AI UGC" category — UGCOrigin is human-only.

export const CATEGORIES: string[] = [
  "Beauty & Skincare",
  "Fashion",
  "Food & Cooking",
  "Fitness & Health",
  "Finance & Fintech",
  "SaaS / Tech",
  "Lifestyle",
  "Travel & Lifestyle",
  "Product Reviews",
  "Product Demo",
  "Unboxing",
  "Video Testimonials",
  "Testimonials",
  "Social Posts",
  "Brand Ambassador",
  "Skits",
  "Meme / Faceless Page",
  "Voice Over",
  "Music & Audio",
  "Music Promotion",
  "Gaming",
  "Live Streaming",
  "Podcast / Interview",
  "Education & Tutorials",
  "Dance & Choreography",
  "Event Coverage",
  "Modeling",
  "Styling & Makeup",
  "Photography",
  "Videography",
  "Editing",
  "Clipping",
  "Motion Graphics",
  "Animation",
  "Graphic Design",
  "Illustration",
  "Copywriting",
  "Scriptwriting",
  "Translation / Subtitles",
  "Reposts / Amplification",
  "Directing",
  "Other",
];

// Nigerian regions (matched against the free-text location). "Remote" for
// creators who work from anywhere.
export const REGIONS: string[] = [
  "Lagos",
  "Abuja",
  "Rivers",
  "Oyo",
  "Kano",
  "Enugu",
  "Anambra",
  "Kaduna",
  "Delta",
  "Edo",
  "Ogun",
  "Akwa Ibom",
  "Cross River",
  "Imo",
  "Plateau",
  "Ondo",
  "Osun",
  "Kwara",
  "Benue",
  "Abia",
  "Remote",
];

export const PLATFORM_FILTERS: { label: string; value: string }[] = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "YouTube", value: "youtube" },
  { label: "X", value: "x" },
  { label: "Snapchat", value: "snapchat" },
  { label: "Twitch", value: "twitch" },
];

export const BUDGET_FILTERS: { label: string; value: string }[] = [
  { label: "Any budget", value: "" },
  { label: "Under ₦25k", value: "25000" },
  { label: "Under ₦50k", value: "50000" },
  { label: "Under ₦100k", value: "100000" },
  { label: "Under ₦200k", value: "200000" },
];

export const SORT_FILTERS: { label: string; value: string }[] = [
  { label: "Recommended", value: "" },
  { label: "Top rated", value: "rating" },
  { label: "Lowest price", value: "price_asc" },
  { label: "Highest price", value: "price_desc" },
  { label: "Recently active", value: "recent" },
];
