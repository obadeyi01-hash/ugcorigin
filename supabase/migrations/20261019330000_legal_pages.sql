-- ============================================================================
-- UGCOrigin, legal pages seeded into doc_pages (category "Legal").
-- Full working drafts so the routes render real content; editable from
-- /admin/docs. on-conflict-do-nothing so admin edits are never overwritten by
-- re-runs. These are drafts to be reviewed with qualified counsel.
-- ============================================================================

insert into public.doc_pages (slug, title, category, sort, body) values

('terms', 'Terms of Service', 'Legal', 1, $legal$
_Working draft — under review with counsel. Last updated on publish._

These Terms of Service ("Terms") govern your access to and use of UGCOrigin (the "Platform"), operated by **Dream Intrepid Ltd.** ("UGCOrigin", "we", "us"). By creating an account or using the Platform you agree to these Terms. If you do not agree, do not use the Platform.

## 1. Who we are
UGCOrigin is a two-sided marketplace that connects brands with verified, human creators for original user-generated content ("UGC"). We provide the marketplace, identity verification, escrow-protected payments, messaging and dispute support. We are not a party to the agreement for content between a brand and a creator, except as expressly set out for escrow and dispute resolution.

## 2. Eligibility
You must be at least 18 years old and able to form a binding contract. You must provide accurate information and keep it current. One person may hold both a brand account and a creator account on the same email, as distinct profiles; you may not use the Platform to hire your own creator profile.

## 3. Accounts and verification
You are responsible for activity under your account and for keeping your credentials secure. We may require identity, bank or business verification before you can go live, receive payouts, or transact. We may refuse, suspend or remove accounts that breach these Terms or present risk to the community.

## 4. Human, original content only
UGCOrigin is for original content made by real humans. Passing off AI-generated or third-party content as your own, misrepresenting your identity, or using stolen or recycled media is prohibited and may result in strikes, loss of ranking, or removal.

## 5. Fees and payments
Creators keep 100% of the rate they set. Brands pay a flat service fee on top of the creator's rate, always shown before funding. Deals are funded into escrow and released on approval. Full detail is in **Fees & payments** and **How escrow protects you**.

## 6. Conduct
You agree not to: circumvent the Platform to take funded deals off-platform; share contact details to avoid escrow before a contract is funded; harass, defraud or impersonate others; post unlawful, infringing or harmful content; scrape, probe or disrupt the Platform. Repeated attempts to move deals off-platform may lead to strikes or suspension.

## 7. Content, licences and usage rights
Creators retain ownership of content they create unless they agree otherwise in a deal. The usage rights a brand receives (scope, duration, platforms, exclusivity) are those stated in the brief or package the brand funded. You are responsible for ensuring you have the rights to everything you submit, including music, trademarks and the likeness of any person featured.

## 8. Disputes
If a deal goes wrong, either party may open a dispute before completion. Our Trust & Safety team reviews it against the written brief and decides how the held escrow is allocated. Escrow stays held until the dispute is resolved. Our decision on escrow allocation is final for the funds we hold.

## 9. Physical products
Where a deal involves shipping a physical product, the parties arrange delivery between themselves using a courier of their choice. UGCOrigin is not the carrier and is not liable for loss, damage or delay. Follow the safety guidance shown in the gig.

## 10. Disclaimers and liability
The Platform is provided "as is". To the fullest extent permitted by law, UGCOrigin is not liable for indirect or consequential losses, and our total liability for any claim is limited to the fees we earned on the deal giving rise to the claim. Nothing limits liability that cannot be limited by law.

## 11. Suspension and termination
You may close your account at any time. We may suspend or terminate access for breach of these Terms, risk, or legal reasons. Obligations that by their nature survive termination (including payment, usage rights already granted, and liability) continue.

## 12. Changes
We may update these Terms. Material changes will be notified in-app or by email. Continued use after changes take effect means you accept them.

## 13. Governing law
These Terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Nigeria have jurisdiction, without prejudice to any mandatory consumer protections in your location.

## 14. Contact
Questions about these Terms: **legal@ugcorigin.com**. UGCOrigin is a product of Dream Intrepid Ltd.
$legal$),

('privacy', 'Privacy Policy', 'Legal', 2, $legal$
_Working draft — under review with counsel. Last updated on publish._

This Privacy Policy explains how **Dream Intrepid Ltd.** ("UGCOrigin", "we") collects, uses and protects your personal data when you use UGCOrigin. We aim to comply with the **Nigeria Data Protection Act (NDPA) 2023** and good international practice.

## 1. Data we collect
- **Account data:** name, email, phone number, username, role (brand/creator), password (hashed by our auth provider).
- **Profile data:** bio, location, niches, rate, photos, logos, social handles, portfolio and showcase media.
- **Verification data:** identity, bank and business details you submit for verification and payouts.
- **Transaction data:** offers, gigs, escrow funding, payouts and ledger entries.
- **Communications:** messages, attachments and support tickets.
- **Usage data:** device, log, and (only after consent) analytics data.

## 2. How we use it
To operate the marketplace; verify identity; hold escrow and pay out; match brands and creators; power search and recommendations; prevent fraud and abuse; provide support; send transactional notifications; and, with your consent, analytics and product updates.

## 3. Legal bases
We process data to perform our contract with you, to comply with legal obligations (e.g. KYC/AML and tax), for our legitimate interests in running a safe marketplace, and on your consent (e.g. analytics cookies and marketing email).

## 4. Privacy between users
To protect everyone, we show a creator's name as "First L." and hide social handles and phone numbers publicly. Full name and contact details are revealed to the other party only once a deal is funded. Messages are scanned to prevent sharing contact details off-platform before a contract exists.

## 5. Sharing
We share data with service providers who help us run the Platform — payments (Paystack), media hosting (Cloudinary), database/auth (Supabase), email (our email provider) and, where enabled, identity verification and analytics. They process data on our instructions. We may disclose data where required by law.

## 6. Payments
Card and bank details are handled by our payment processor (Paystack); we do not store full card numbers. Payout bank details are stored to the extent needed to pay you.

## 7. Cookies and analytics
Essential cookies keep the Platform working. Analytics and marketing tools load **only after you consent** via the cookie banner, and only where their IDs are configured. You can change your choice at any time.

## 8. Retention
We keep personal data for as long as your account is active and as needed for legal, tax, accounting and dispute purposes, then delete or anonymise it.

## 9. Your rights
Subject to law, you may access, correct, delete, restrict or port your data, and object to certain processing. Contact **privacy@ugcorigin.com**. You may also complain to the Nigeria Data Protection Commission.

## 10. Security
We use encryption in transit, access controls, row-level security and audited admin actions. No system is perfectly secure; tell us immediately if you suspect an issue.

## 11. Children
UGCOrigin is not for anyone under 18.

## 12. Changes
We will notify material changes in-app or by email.

## 13. Contact
**privacy@ugcorigin.com** — Dream Intrepid Ltd.
$legal$),

('escrow-terms', 'Escrow Terms', 'Legal', 3, $legal$
_Working draft — under review with counsel. Last updated on publish._

These Escrow Terms explain how funds are held and released for deals on UGCOrigin. They supplement the Terms of Service.

## 1. How escrow works
When a brand funds a deal, the amount (the creator's rate plus the service fee) is charged through our payment processor and **held** against the gig. The creator is not paid yet, and the brand cannot unilaterally reclaim the funds. The funds are released only as set out below.

## 2. UGCOrigin's role
UGCOrigin holds funds as a neutral facilitator to make the deal safe. We are not a bank and do not pay interest on held funds. Funds are held with, and moved by, our regulated payment processor.

## 3. Release to the creator
On the brand's approval of the delivered work, escrow releases the creator's rate and a payout is queued to the creator's verified bank account. If a brand does not act within the agreed review window, approval may proceed so creators are not left unpaid indefinitely.

## 4. Refunds
Before work is approved, a deal may be refunded to the brand where the parties agree, where the creator does not deliver, or as decided in a dispute. The service fee covers verification, escrow and processing and may be non-refundable once a deal is funded, except where required by law or decided in a dispute.

## 5. Disputes
Either party may open a dispute before completion. Escrow stays held until our Trust & Safety team decides, against the written brief, how to allocate the held amount between the parties. That decision is final for the funds we hold. Opening a false or bad-faith dispute may lead to strikes.

## 6. Campaign pools
For per-view campaigns, the brand funds a pool. Creators are paid per 1,000 verified views from the pool; unspent pool funds remain the brand's. Claims and forfeits are recorded to keep counts honest.

## 7. Chargebacks and fraud
Fraudulent funding, chargebacks on completed work, or attempts to launder funds are prohibited and may be reported to authorities and the payment processor.

## 8. Currency and taxes
Funds are handled in Naira. You are responsible for your own taxes.

## 9. Contact
**payments@ugcorigin.com** — Dream Intrepid Ltd.
$legal$),

('creator-agreement', 'Creator Agreement', 'Legal', 4, $legal$
_Working draft — under review with counsel. Last updated on publish._

This Creator Agreement applies to creators who offer services on UGCOrigin, in addition to the Terms of Service.

## 1. Independent creator
You are an independent contractor, not an employee, agent or partner of UGCOrigin. You decide whether, when and how to accept work, and you are responsible for your own taxes, equipment and compliance.

## 2. Your content and warranties
You warrant that the content you deliver is **original and human-made**, that you own or have licensed everything in it (including music, logos, locations and the likeness of any person featured), and that it does not infringe anyone's rights or break the law. You will not deliver AI-generated work passed off as human, or content you do not have the rights to.

## 3. Usage rights you grant
For each funded deal, you grant the brand the usage rights stated in the brief or package (scope, platforms, duration and exclusivity). Unless the deal says otherwise, you retain ownership of your content and may show the delivered work in your own portfolio. You grant UGCOrigin a limited licence to host, display and promote your profile and public showcase on the Platform.

## 4. Delivery and conduct
Deliver on time and to brief. Keep communication and files on-platform — sharing contact details to move a funded deal off UGCOrigin is prohibited and is auto-moderated. Honour agreements you accept; ghosting, pulling delivered work, or taking deals off-platform can result in strikes, lower ranking, benching or removal.

## 5. Payment
You keep 100% of the rate you set. Payment is held in escrow and released to your verified bank account on approval. You are responsible for providing correct payout details.

## 6. Standing, tiers and strikes
Your tier and ranking reflect real outcomes — completed gigs, reviews, on-time delivery and reliability. Trust violations add strikes that lower your ranking; repeated violations can bench your profile until resolved.

## 7. Verification
You may need to verify identity and bank details to go live and get paid. Keep your profile honest; frequent avatar changes or suspected false/AI media may be reviewed.

## 8. Termination
You can stop offering services at any time. We may suspend creators who breach this Agreement. Usage rights already granted for funded deals survive.

## 9. Contact
**creators@ugcorigin.com** — Dream Intrepid Ltd.
$legal$),

('brand-agreement', 'Brand Agreement', 'Legal', 5, $legal$
_Working draft — under review with counsel. Last updated on publish._

This Brand Agreement applies to brands who hire creators on UGCOrigin, in addition to the Terms of Service.

## 1. Hiring and briefs
You are responsible for the accuracy and legality of your brief, product claims and any materials you provide. Be clear about deliverables, usage rights, platforms, exclusivity and deadlines — these define what you receive and how disputes are judged.

## 2. Payment and escrow
Deals are funded upfront into escrow: the creator's rate plus a flat service fee shown before you pay. Funds are held and released to the creator when you approve the work. If you do not review within the agreed window, approval may proceed so creators are paid fairly. Package deals and campaigns are paid first, before work begins.

## 3. Usage rights you receive
On approval, you receive the usage rights stated in the brief or package you funded — the scope, platforms, duration and exclusivity you specified. You do not acquire rights beyond what the deal states, and you may not use preview or watermarked drafts commercially before approval and release.

## 4. Conduct
Keep deals on-platform so both sides are protected by escrow. Do not use the Platform to solicit creators off-platform to avoid fees, request unlawful content, or misuse creators' likeness or content beyond the agreed rights.

## 5. Physical products
If you ship a product to a creator, arrange delivery with a tracked courier, keep it respectful and safe, and follow the in-gig guidance. UGCOrigin is not the carrier and is not responsible for courier loss or damage.

## 6. Disputes
If work does not match the brief, open a dispute before completion. Our Trust & Safety team decides against the written brief how escrow is allocated. Clear briefs lead to clear outcomes.

## 7. Reliability
Your funding, completion and dispute history inform the reliability signals creators see. Consistently funding what you post and treating creators fairly improves your standing.

## 8. Termination
You may close your account at any time. We may suspend brands who breach this Agreement. Rights and obligations from funded deals survive.

## 9. Contact
**brands@ugcorigin.com** — Dream Intrepid Ltd.
$legal$)

on conflict (slug) do nothing;
