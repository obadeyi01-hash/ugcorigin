-- ============================================================================
-- UGCOrigin, editable documentation (admin-managed help/policy pages)
-- Long-form, scrollable docs that hold the real, verbose detail (fees, escrow,
-- payouts, trust) that the marketing pages keep vague. Public reads published
-- pages; only the service role (admin actions) writes them.
-- ============================================================================

create table public.doc_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  category    text not null default 'General',
  body        text not null default '',
  published   boolean not null default true,
  sort        smallint not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);
create index doc_pages_category_idx on public.doc_pages (category, sort);

alter table public.doc_pages enable row level security;
create policy doc_pages_read on public.doc_pages for select to anon, authenticated
  using (published or public.is_admin());
grant select on public.doc_pages to anon, authenticated;
-- writes: service role only (admin actions).

insert into public.doc_pages (slug, title, category, sort, body) values
('fees-and-payments', 'Fees & payments', 'Payments & fees', 1, $doc$
## What it costs

UGCOrigin is **free to join, free to browse, and free to message**. There are no monthly fees and no listing fees. You only ever pay in connection with real work.

### Creators keep 100%
When a brand hires you, the rate you agreed is the rate you receive. UGCOrigin does **not** take a cut from the creator side. What you quote is what lands in your bank account on payout.

### Brands pay a flat service fee
Brands pay a small flat service fee on top of the creator's rate when they fund a deal. The exact fee is always shown to you **before you pay**, on the funding screen, added to the creator's rate, with the total spelled out. Nothing is hidden and nothing is charged until you choose to fund.

The fee is what keeps every deal safe: it pays for escrow, identity verification, dispute handling and next-day payouts (see below). It is a percentage of the deal with a small minimum, and it is only ever charged on funded work, never on signing up, browsing or chatting.

### Per-view campaigns
If you'd rather pay for results, fund a campaign pool and pay creators per 1,000 verified views. You set the rate, unspent pool stays yours, and claims and forfeits are public to keep view counts honest.

### Taxes
Prices are in Naira. Taxes may apply where required by law.
$doc$),
('how-escrow-works', 'How escrow protects you', 'Payments & fees', 2, $doc$
## Escrow on every deal

When a brand funds a deal, the money is held **in escrow**, not paid to the creator yet, and not kept by the brand. It sits safely until the work is done and approved.

### For brands
Your money is protected. The creator only gets paid once you approve the work against the brief. If something goes wrong, you can open a dispute and the funds stay held until it's resolved.

### For creators
You know the money is really there before you start. No chasing invoices, no ghosting, once your work is approved, the release and payout happen automatically.

### Release
On approval, escrow releases to the creator and a payout is queued to their verified bank account. Every step is recorded in an immutable ledger.
$doc$),
('getting-paid', 'Getting paid', 'For creators', 1, $doc$
## Next-day bank payouts

Once a brand approves your work, your payout is queued automatically to the bank account you verified during onboarding.

### Before you can be paid
- Verify your identity.
- Add and verify your bank account (we confirm the account name for free).
- Keep your profile complete and live.

### How much you keep
All of it. Your agreed rate is what you receive, UGCOrigin takes no creator-side cut.

### Price floors
Each tier has a minimum rate (a floor) so creators aren't pushed into pricing themselves too low. As you complete gigs and earn strong reviews, you climb tiers, one step at a time, and unlock higher floors.
$doc$),
('for-brands', 'For brands', 'For brands', 1, $doc$
## Hiring on UGCOrigin

1. **Post a brief** or browse verified creators directly.
2. **Agree a deal** and fund it, escrow holds the money safely. The service fee is shown before you pay.
3. **Review the work** in the shared workspace with time-stamped feedback.
4. **Approve**, escrow releases and the creator is paid. If needed, request a revision or open a dispute.

Every creator is identity-verified, so you're working with real humans making original content.
$doc$),
('for-creators', 'For creators', 'For creators', 2, $doc$
## Making a living on UGCOrigin

1. **Create your profile** and set your rate (at or above your tier floor).
2. **Verify** your identity and bank so you can go live and get paid.
3. **Get hired**, through direct offers, open briefs or per-view campaigns.
4. **Deliver** in the workspace, get approved, and receive your full rate on a next-day payout.

Keep delivering great work and earning reviews to climb tiers and unlock higher floors and more visibility.
$doc$),
('trust-and-safety', 'Trust & safety', 'Trust & safety', 1, $doc$
## Built to protect both sides

- **Escrow by default**, money is held until work is approved.
- **Verified humans**, every creator passes identity verification.
- **Fair disputes**, decided against the written brief using the workspace record.
- **Keep it on-platform**, communicating and paying through UGCOrigin keeps your protection and records intact. Off-platform deals void that protection.

Spotted a problem? Email support@ugcorigin.com or open a dispute from your gig.
$doc$);
