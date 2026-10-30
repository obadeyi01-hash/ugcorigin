-- ============================================================================
-- UGCOrigin, reword "escrow" out of user-facing doc_pages copy (help + legal).
--
-- The word "escrow" carries licensing/regulatory risk in Nigeria, so the
-- rendered help and legal pages now describe the behaviour ("payment
-- protection", "held safely", "released on approval") without the loaded term.
--
-- Additive and idempotent: each UPDATE replaces specific phrases, so once a row
-- is reworded the search strings no longer match and re-running is a no-op; a
-- row an admin already edited past these phrases is left alone. Slugs are left
-- unchanged (they are DB/URL identifiers), as are the escrow_transactions
-- table, ledger entry types and every other internal code identifier.
-- ============================================================================

-- ---- Help docs -------------------------------------------------------------

update public.doc_pages
set title = 'How payment protection works',
    body = replace(replace(replace(body,
      '## Escrow on every deal', '## Payment protection on every deal'),
      'the money is held **in escrow**, not paid', 'the money is held **safely**, not paid'),
      'On approval, escrow releases to the creator', 'On approval, the held payment is released to the creator')
where slug = 'how-escrow-works';

update public.doc_pages
set body = replace(body,
  'it pays for escrow, identity verification', 'it pays for payment protection, identity verification')
where slug = 'fees-and-payments';

update public.doc_pages
set body = replace(replace(body,
  'fund it, escrow holds the money safely', 'fund it, payment protection holds the money safely'),
  '**Approve**, escrow releases and the creator is paid', '**Approve**, the payment is released and the creator is paid')
where slug = 'for-brands';

update public.doc_pages
set body = replace(body,
  '**Escrow by default**, money is held', '**Payment protection by default**, money is held')
where slug = 'trust-and-safety';

-- ---- Legal pages -----------------------------------------------------------

update public.doc_pages
set body = replace(replace(replace(replace(body,
  'escrow-protected payments', 'payment-protected transactions'),
  'set out for escrow and dispute resolution', 'set out for payment protection and dispute resolution'),
  'funded into escrow and released on approval', 'funded with payment protection and released on approval'),
  '**How escrow protects you**', '**How payment protection works**')
where slug = 'terms';

update public.doc_pages
set body = replace(replace(body,
  'share contact details to avoid escrow before', 'share contact details to avoid payment protection before'),
  'how the held escrow is allocated. Escrow stays held until the dispute is resolved. Our decision on escrow allocation is final',
  'how the held payment is allocated. The payment stays held until the dispute is resolved. Our decision on allocation is final')
where slug = 'terms';

update public.doc_pages
set body = replace(replace(body,
  'escrow funding, payouts and ledger entries', 'payment funding, payouts and ledger entries'),
  'verify identity; hold escrow and pay out;', 'verify identity; hold and release protected payments;')
where slug = 'privacy';

update public.doc_pages
set title = 'Payment protection terms',
    body = replace(replace(replace(replace(replace(body,
      'These Escrow Terms explain', 'These payment protection terms explain'),
      '## 1. How escrow works', '## 1. How payment protection works'),
      'escrow releases the creator''s rate', 'the held payment is released as the creator''s rate'),
      'verification, escrow and processing', 'verification, payment protection and processing'),
      'Escrow stays held until our Trust', 'The payment stays held until our Trust')
where slug = 'escrow-terms';

update public.doc_pages
set body = replace(body,
  'Payment is held in escrow and released', 'Payment is held safely and released')
where slug = 'creator-agreement';

update public.doc_pages
set body = replace(replace(replace(replace(body,
  '## 2. Payment and escrow', '## 2. Payment and protection'),
  'funded upfront into escrow: the creator''s rate', 'funded upfront with payment protection: the creator''s rate'),
  'both sides are protected by escrow.', 'both sides are protected.'),
  'how escrow is allocated.', 'how the held payment is allocated.')
where slug = 'brand-agreement';
