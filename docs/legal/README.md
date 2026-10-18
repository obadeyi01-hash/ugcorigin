# UGCOrigin — Legal documents (P0 starter drafts)

> ⚠️ **DRAFTS — NOT LEGAL ADVICE.** These are starter documents prepared to accelerate and reduce the cost of legal review. They **must be reviewed and finalized by a qualified Nigerian lawyer** (ideally one versed in fintech/payments, data protection, and marketplace/IP law) before they are published or relied upon. Do not take real payments or process KYC data on the strength of these drafts alone. See `../legal-framework.md` for the full compliance map and the lawyer brief.

## Documents (P0 — needed before the first real paid gig)
| File | Purpose |
|---|---|
| `terms-of-service.md` | Master platform terms; marketplace/intermediary positioning, accounts, acceptable use, liability, disputes, governing law. |
| `privacy-policy.md` | NDPA 2023 / NDPR data-protection notice; KYC/BVN handling, processors, rights, DPO. |
| `creator-agreement.md` | Creator terms; independent contractor, IP licensing/assignment on payment, payouts, tax, conduct. |
| `brand-agreement.md` | Brand terms; hiring, 12% fee, escrow, usage rights received, refunds/disputes. |
| `escrow-payment-terms.md` | How money is held and released; refunds, chargebacks, dispute adjudication. |

## How to use
1. Fill every `[BRACKETED PLACEHOLDER]` (company details, RC number, addresses, emails, effective dates).
2. Send to your lawyer together with `../legal-framework.md` §6 (the lawyer brief).
3. Resolve the **open legal questions** flagged inline (⚖️) — especially the escrow/PSSP licensing question, which is existential.
4. On launch, present these as **click-wrap** at signup/checkout, **versioned**, with acceptance **timestamped** (the schema can log acceptance). Keep a changelog of versions.

## Global placeholders (fill once, consistent across all docs)
- **[COMPANY]** = Dream Intrepid Ltd.
- **[RC_NUMBER]** = [CAC registration number]
- **[REG_ADDRESS]** = [registered office address, Nigeria]
- **[PLATFORM]** = UGCOrigin (ugcorigin.com)
- **[EFFECTIVE_DATE]** = [date]
- **[SUPPORT_EMAIL]** = support@ugcorigin.com · **[LEGAL_EMAIL]** = legal@ugcorigin.com · **[PRIVACY/DPO_EMAIL]** = privacy@ugcorigin.com · **[DISPUTES_EMAIL]** = disputes@ugcorigin.com
- **[GOVERNING_LAW]** = Federal Republic of Nigeria · **[VENUE]** = [Lagos State]
- **[FEE_PERCENT]** = 12% (brand-side platform/protection fee) · **[FEE_MIN]** = [₦ minimum, e.g. ₦500]
- **[PAYMENT_PROVIDER]** = Paystack (primary) · **[KYC_PROVIDER]** = Smile ID (primary), Dojah (backup)
