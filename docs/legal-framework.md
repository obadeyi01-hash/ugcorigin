# UGCOrigin — Legal framework (for airtight compliance)

> **Status:** v1 framework — 2026-10-17. **Not legal advice.** This maps what UGCOrigin needs and what to get your lawyer to draft/confirm. Entity: **Dream Intrepid Ltd.** Jurisdiction: **Nigeria-first**, built to extend.
> **The two things that can sink a marketplace legally:** (1) how money is held (escrow), (2) how personal data is handled (NDPR). Both are flagged as top risks and must be nailed before real transactions.

---

## 1. The document set (what we need to publish)

| # | Document | Why it matters | Priority |
|---|---|---|---|
| 1 | **Terms of Service** | Defines UGCOrigin as a *neutral marketplace/intermediary* (not the employer or the content owner), acceptable use, accounts, liability caps, governing law, dispute/arbitration. | P0 |
| 2 | **Privacy Policy (NDPR/NDPA-compliant)** | Lawful basis, data collected incl. KYC/BVN, processors (Paystack, Smile ID, Dojah, GA/Clarity/Meta), retention, data-subject rights, DPO, cross-border transfer. | P0 |
| 3 | **Escrow / Payment Terms** | Who holds funds, release conditions, refunds, chargebacks, dispute adjudication. Ties to the escrow structure (§12.2 PRD). | P0 |
| 4 | **Creator Agreement** | Independent-contractor status (NOT employee), content **IP assignment/licensing on payment**, deliverables, payouts, tax responsibility, conduct, termination. | P0 |
| 5 | **Brand Agreement** | Hiring terms, platform fee, escrow, **usage rights received**, refund/dispute rules, acceptable use. | P0 |
| 6 | **Content Licensing & Usage terms** | Scope of the license brands buy (raw vs edited, exclusivity, duration, territory, platforms), **model/property releases**, music/third-party rights. | P0 |
| 7 | **Community Guidelines / Acceptable Use** | Prohibited content, **anti-AI / human-origin policy**, harassment, spam, off-platform-circumvention ban (protects escrow). | P1 |
| 8 | **Dispute Resolution Policy** | The mediation process, evidence (the on-platform workspace), outcomes, timelines. | P1 |
| 9 | **Refund & Cancellation Policy** | FCCPC consumer-protection aligned; when refunds happen, partial releases. | P1 |
| 10 | **Cookie/Tracking consent** | Consent management for GA4/Clarity/Meta Pixel under NDPR. | P1 |
| 11 | **Copyright / Takedown policy** | Notice-and-takedown for infringing uploads; repeat-infringer rule. | P2 |
| 12 | **Creator Payout & Tax notice** | Creators are responsible for their own tax; what we report/withhold (if any). | P2 |

---

## 2. Escrow / financial (the existential one — see PRD §12.2)
- **Do NOT hold user funds in Dream Intrepid's own account.** That can trigger PSSP/money-transmitter licensing (CBN). Use **provider-native settlement** (Paystack split/subaccounts + deferred transfer) or a **licensed escrow partner**; a ring-fenced client-funds account only with explicit legal sign-off.
- **Confirm with lawyer:** does our Paystack-based collect→hold→release-on-approval flow require any CBN/PSSP licence, or does operating *through* a licensed PSP keep us clear? What record-keeping/AML obligations attach?
- **Consumer protection (FCCPC):** refund rights, no unfair terms, clear pricing (the 12% fee must be disclosed up front — already in the model).
- **AML/KYC:** KYC before payout (Smile ID/Dojah); transaction monitoring/velocity; SAR obligations if any.

## 3. Data protection (NDPR / NDPA 2023)
- **Register** Dream Intrepid Ltd. as a data controller; appoint a **DPO**; file the annual NDPR audit if over the processing threshold.
- **Lawful basis** for each purpose (contract, consent for marketing/cookies, legal obligation for KYC).
- **KYC/BVN/NIN data is sensitive** — minimize, encrypt, restrict access, define retention, and sign **Data Processing Agreements** with every processor (Paystack, Smile ID, Dojah, Supabase, analytics).
- **Data-subject rights** (access, correction, deletion) + request flow. **Breach notification** process.
- **Cross-border transfer** basis (Supabase/analytics may be outside Nigeria) — adequacy/SCC-equivalent.

## 4. Marketplace liability & IP
- Position UGCOrigin as an **intermediary** (safe-harbour-style), not the principal creator/publisher — reduces liability for user content, paired with takedown + moderation.
- **IP flow:** creator grants/assigns the agreed license to the brand **on payment/approval**; platform takes a licence to display/watermark/host. Make the assignment enforceable and automatic in the Creator/Brand agreements.
- **Model/property/music releases** for content featuring people, private property, or third-party music — put the obligation on the creator, warranted in the Creator Agreement.
- **Anti-AI representation:** creators warrant content is original human-made (supports the brand promise and limits deceptive-content liability).

## 5. Corporate / tax
- Confirm **CAC registration** of Dream Intrepid Ltd. is active and the right objects cover a marketplace.
- **VAT/tax (FIRS):** is VAT chargeable on the 12% platform fee? Who remits? Creator income is self-reported.
- Trademark: consider registering **UGCOrigin** word/mark.

---

## 6. What to send your lawyer (one brief)
> "Dream Intrepid Ltd. is launching **UGCOrigin**, a Nigeria-first two-sided UGC marketplace. Brands pay for content; we hold payment in escrow via **Paystack** and release to the creator's bank on approval; we charge brands a **12%** fee. We verify creator identity (BVN/NIN via Smile ID/Dojah) and process personal data. Please advise on and/or draft:
> 1. **Escrow/payments:** can our Paystack collect→hold→release flow run without a CBN/PSSP licence, or what structure is compliant? AML/KYC obligations?
> 2. **NDPR/NDPA:** controller registration, DPO, KYC/BVN handling, DPAs with processors, cross-border transfer, breach process.
> 3. **Document set (12 above):** draft/review ToS, Privacy, Escrow/Payment terms, Creator & Brand agreements, Content Licensing (incl. releases), Acceptable Use, Dispute, Refund, Cookie, Takedown.
> 4. **Marketplace liability:** intermediary positioning & content liability limits.
> 5. **IP/licensing:** enforceable auto-assignment of usage rights to brands on payment.
> 6. **Tax:** VAT treatment of the platform fee; trademark on UGCOrigin.
> Please quote for the above and flag anything that blocks taking real payments."

---

## 7. Sequencing (so legal doesn't block the build)
- **Now:** send the lawyer brief; keep building (no real money moves until §2 is confirmed).
- **Before first real paid gig (P0):** ToS, Privacy, Escrow/Payment terms, Creator & Brand agreements, Content Licensing — published and accepted at signup/checkout (click-wrap, versioned, with acceptance timestamps — the schema can log this).
- **Before scale (P1/P2):** the rest.

> **Starter drafts are in `docs/legal/`** (ToS, Privacy, Creator & Brand agreements, Escrow & Payment terms + README) — editable, with `[PLACEHOLDERS]` and ⚖️ open questions marked, for your lawyer to finalize. They are drafts, not legal advice.
