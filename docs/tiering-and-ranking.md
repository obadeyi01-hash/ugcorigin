# UGCOrigin — Tiering, entry-leveling & ranking (the "leveler")

> **Status:** v2 — 2026-10-18. **Engine implemented in SQL** (`*_tier_enum.sql` + `*_tier_engine.sql`): 7 tiers, per-tier price floors (`tier_config` + `enforce_rate_floor`), EPS (`compute_eps`), ERS (`compute_ers`), rolling metrics from real gigs/reviews (`recompute_creator_metrics`), ±1-step tier movement with weekly standings (`recompute_creator_tier`), driven by triggers on gig completion, reviews and entry-signals. Spec schema in `*_tiering.sql`.
> **Placement at go-live (done 2026-10-18):** `placeCreator()` (`src/lib/tiering/placement.ts`) writes `entry_signals` when a creator goes live (self-serve `goLiveAction` or admin `adminSetLive`) → the `trg_entry_signals` trigger runs `compute_eps` (capped at Pro) + `recompute_creator_tier`. **Honest inputs only:** `portfolio_count` (real linked samples) + `niche_demand_score` (configured index, `src/lib/niche-demand.ts`); `verified_followers` and `prior_work_score` stay 0 until real follower-API verification and verified prior-work evidence are wired — placement improves when they are. Needs `*_tier_engine.sql` applied for the compute to fire.
> **Goal:** credit creators who arrive with real credibility (following, proven work) so they don't start invisible and leave — **without** overcompensating them or burying newcomers who are trying to make a name. A *leveler*, not a tax that punishes. New talent is a priority; established talent is welcomed on a **decaying head start they must validate**.

---

## 0. The core idea in one paragraph
A new creator's standing is the sum of two things: a **head start** earned from *verified external credibility* (followers, portfolio, past work) that is **capped and decays**, and an **earned reputation** built entirely from on-platform outcomes that **compounds forever**. Established creators get discovered fast but must prove it within their first few gigs or they slide back. Newcomers are protected by a guaranteed slice of visibility (**opportunity slots**) funded by capping how much of the spotlight the top creators can hoard. Over time, head start fades to zero and only earned reputation remains — so the platform always trends toward *actual quality*, not *imported clout*.

---

## 1. Two scores

### 1.1 Entry Placement Score (EPS) — the head start, 0–100
Computed **once at onboarding** (and re-computable if they link more verified socials), from **verified** signals only. Stored in `entry_signals`.

| Signal | How it's measured | Max points | Notes |
|---|---|---|---|
| Verified following | `min(25, 6 × log10(followers+1))` summed across linked+**verified** IG/TikTok/YT, then capped | **25** | Log-scaled: 1k→~18, 10k→~24, 100k→25. Diminishing returns so mega-following ≠ runaway score. |
| Portfolio depth & quality | count of verified samples × quality factor (light admin/AI review) | **25** | 5+ strong samples maxes it. |
| Prior work evidence | verified brand tags / case studies / testimonials | **25** | Must be verifiable; unverifiable claims score 0. |
| Niche demand match | demand index of their niches (helps liquidity) | **15** | Small nudge toward niches brands actually want. |
| Identity + bank verified | required gate | **10** | 0 if not verified → **cannot be placed or discovered at all** (the §4.3 gate). |

`EPS = sum, capped at 100.`

### 1.2 Earned Reputation Score (ERS) — the engine, 0–100
Recomputed on a rolling window from **on-platform outcomes** (`creator_metrics`). This is what matters long-term.

```
ERS = 100 × (
  0.30 × approval_rate          // brand approved the work
+ 0.20 × on_time_rate           // delivered by deadline
+ 0.20 × repeat_hire_rate       // brands come back / rebook
+ 0.15 × review_quality         // avg of speed/comms/quality ratings, normalized
+ 0.10 × (1 − dispute_rate)     // stayed dispute-free
+ 0.05 × activity               // response time + recent activity + acceptance
)
```
All inputs normalized 0–1. **Cold start:** with < 3 completed gigs, ERS is blended with EPS (see §3) so new creators aren't judged on noise.

---

## 2. Tiers & entry placement

**Seven tiers (v2, 2026-10-18):** **Origin → Rising → Pro → Standout → Elite → Signature → Luminary.** The enum order *is* the ladder (`tier_rank`). Labels, taglines and floors live in the **`tier_config`** table (admin-editable).

**Entry is capped at Pro (rank 3).** You cannot buy Standout/Elite/Signature/Luminary with followers — those are **earned only**. This is the anti-overcompensation rule.

**No jumping.** Tier changes move **at most ±1 rung per recompute** (`recompute_creator_tier`), up or down. You climb (and slide) one step at a time.

### 2.1 Per-tier price FLOORS (launch defaults, tunable in `tier_config`)
A creator can price *at or above* their tier's floor, never below — enforced by the `enforce_rate_floor` trigger on `creator_profiles` (clamps `starting_rate_naira` up to the floor). Higher tiers = higher floors = a credible price signal, and a real reason to climb.

| Rank | Tier | Floor (₦) | Signals |
|---|---|---|---|
| 1 | Origin | 10,000 | Verified human — starting line |
| 2 | Rising | 20,000 | Gaining traction |
| 3 | **Pro** (entry cap) | 35,000 | Proven, repeatably hired |
| 4 | Standout | 55,000 | Consistently top-rated |
| 5 | Elite | 85,000 | Among the best in niche |
| 6 | Signature | 130,000 | Rare, highly selective |
| 7 | Luminary | 200,000 | Apex — the best on UGCOrigin |

### 2.2 Entry placement
| EPS at onboarding | Starting tier | Head-start multiplier `H₀` |
|---|---|---|
| 0–20 | Origin | 1.00 (baseline) + opportunity protection |
| 21–45 | Rising | 1.15 |
| 46–100 | **Pro (capped)** | 1.30 |

`head_start_multiplier` and `head_start_remaining` (default **5 gigs**) are written to `creator_profiles`.

### 2.1 Head-start decay (the "must validate")
The multiplier decays linearly from `H₀` → `1.00` across the head-start window:
```
H(g) = 1 + (H₀ − 1) × max(0, (gigs_remaining / 5))
```
- Perform well in those first gigs → ERS rises and *carries* you (often past where the head start left off).
- Underperform → head start fades AND ERS is low → you slide. No permanent free ride.

---

## 3. The effective ranking score (used everywhere)
Search ordering, featured, brief↔creator matching, "top 3–5 cards," bids.

```
rank = BASE × H(g) × fit × verification_weight + bounded_boost − penalties

BASE =  w_new × EPS_blend + (1 − w_new) × ERS
w_new = clamp(1 − gigs_completed/3, 0, 1)   // cold-start: lean on EPS early, ERS takes over by ~3 gigs
EPS_blend = min(EPS, 60)                     // even in cold start, imported clout can't dominate

fit            = niche/format/budget/language/region/availability match (0.5–1.3)
verification_weight = verified humans rank above (1.0 vs 0.6 for unverified-but-visible, if ever allowed)
bounded_boost  = paid Boost/Featured — a SMALL additive cap (≤ ~10% of max BASE). Labeled. Never reorders the whole page.
penalties      = anti-gaming (review rings, self-dealing, claim fraud, anomalies)
```

**Organic dominates. Paid boost is a nudge, not a takeover (§8 guardrail).**

---

## 4. The leveler: opportunity slots (how newcomers stay visible)

This is the "tax that levels," made concrete and fair:

1. **Impression cap per creator per niche/week.** No single creator (however boosted) may take more than **X%** (launch default **20%**) of a niche's impressions in a week. Overflow spills into the **opportunity pool**.
2. **Reserved exploration slots.** Every search results page and every brief shortlist reserves **~20%** of positions for creators who are `opportunity_eligible` (low impressions / low gig count / in redemption), rotated for fairness. These are the **"suggestion" slots interleaved between the top 3–5 cards** the product calls for.
3. **Funded by the top.** The reserved slots are literally the redistribution of the capped overflow — established creators' *excess* spotlight pays for newcomers' *first* spotlight. Established creators still win on merit; they just can't monopolize.
4. **Graduation.** Once a newcomer accumulates enough real impressions + a completed, approved gig, they exit `opportunity_eligible` and compete on earned reputation like everyone else. The ladder is a ramp, not a ceiling.

`tier_standings.opportunity_slots` records how much exploration each creator received each week — so we can tune the 20% and prove fairness.

---

## 5. Weekly movement & redemption (from PRD §10)
- **Recomputed weekly.** Tier = f(rank percentile within cohort) with hysteresis (needs a clear margin to move, so you don't flip-flop).
- **Soft, reversible penalties.** Dropping a tier reduces visibility/featured eligibility — **never** seizes funds or locks the account.
- **Redemption always on.** A bad week never bars you: `in_redemption` creators get a recovery quota of opportunity slots and climb back by stringing together good outcomes. Rewards *trajectory*, not just absolute score.
- **Decay prevents coasting.** Inactivity slowly lowers ERS so Signature isn't a lifetime title.

---

## 6. Worked examples (launch defaults — all tunable)

**A. Big-follower newcomer** (120k TikTok verified, 6 samples, some brand tags, identity+bank verified):
- Following 25 (capped) + portfolio 25 + prior work 18 + niche 10 + verified 10 = **EPS 88 → capped entry Pro, H₀ 1.30**, head-start 5 gigs.
- First 5 gigs: if approval/on-time are strong → ERS climbs to ~80 → stabilizes at **Pro/Elite** on merit. If they flake → H decays, ERS ~30 → drops to **Rising/Origin**. *Welcomed, not overcompensated.*

**B. Zero-follower newcomer, serious** (0 verified followers, 3 decent samples, no brand history, identity+bank verified):
- 0 + 12 + 0 + 8 + 10 = **EPS 30 → Rising, H₀ 1.15.** Plus `opportunity_eligible` → guaranteed exploration slots.
- Gets real first gigs via reserved slots; good outcomes → ERS to ~70 → **Pro earned** within weeks. *The "making a name" path works.*

**C. Total newcomer** (0 followers, 1 sample, verified):
- 0 + 5 + 0 + 5 + 10 = **EPS 20 → Origin, baseline.** Heavy opportunity protection.
- The platform actively surfaces them in exploration slots so they can earn their first approved gig. *Nobody starts truly invisible.*

---

## 7. Anti-gaming
- Verified-transaction-only reviews; detect review rings / reciprocal rings / velocity anomalies → penalties.
- Follower/portfolio/prior-work signals must be **verified** (OAuth handle match, sample hosting, brand confirmation) — unverifiable = 0.
- Per-view/funded-pool fraud (inflated views) forfeits publicly (ugc.ng parity) and penalizes ERS.
- Boost is capped and labeled; it cannot touch the exploration reservation.

---

## 8. What we track (data) & where it lives
- `entry_signals` — onboarding inputs + computed EPS + placement tier.
- `creator_profiles.{entry_placement_score, head_start_multiplier, head_start_remaining, earned_reputation, opportunity_eligible}`.
- `creator_metrics` — rolling outcome metrics + ERS (public-readable for live creators, so real stats show once they exist — never fabricated, per §24).
- `tier_standings` — weekly history: tier, score, movement, impressions, opportunity_slots, redemption.
- All scores written by **server-side jobs / edge functions only** (RLS: no user writes).

## 9. Rollout
- **Phase 1:** compute EPS at onboarding (place creators sensibly); exploration reservation on in search. Keep ERS/weekly-tier **computed but hidden** until there's real gig volume (per §24 — don't show tier theatre on an empty marketplace).
- **Phase 2:** turn on visible tiers, weekly movement, leaderboards, redemption once volume makes standings meaningful.
- Treat every constant here (weights, caps, 20% reservation, 5-gig head start) as a **tunable launch default** — instrument, measure fairness (newcomer first-gig rate, established retention), adjust.
