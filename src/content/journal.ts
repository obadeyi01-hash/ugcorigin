/**
 * The public journal. Add a post here and it shows up on /journal, in the
 * sitemap, in the RSS feed, and in llms.txt. Nothing else has to be edited.
 * Dates are the day the piece is meant to be read, not the day the file changed.
 */

export type JournalImage = "verify" | "escrow" | "brief" | "views" | "creator" | "trust";

export type JournalPost = {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD, Africa/Lagos calendar day. */
  date: string;
  image: JournalImage;
  imageAlt: string;
  body: string[];
};

const IMG: Record<JournalImage, { src: string; alt: string }> = {
  verify: { src: "/journal/verify.svg", alt: "A check mark beside a profile, the shape of a passed identity review." },
  escrow: { src: "/journal/escrow.svg", alt: "A locked box sending payment toward a finished piece of work." },
  brief: { src: "/journal/brief.svg", alt: "A written brief with room for one more creator." },
  views: { src: "/journal/views.svg", alt: "A view chart capped by the money left in a campaign pool." },
  creator: { src: "/journal/creator.svg", alt: "A creator card with a name, a niche, and a live badge." },
  trust: { src: "/journal/trust.svg", alt: "A brand and a creator connected only after both sides are verified." },
};

export function journalImage(post: JournalPost) {
  return { src: IMG[post.image].src, alt: post.imageAlt || IMG[post.image].alt };
}

function post(
  date: string,
  slug: string,
  title: string,
  description: string,
  image: JournalImage,
  imageAlt: string,
  body: string[],
): JournalPost {
  return { date, slug, title, description, image, imageAlt, body };
}

export const JOURNAL: JournalPost[] = [
  post(
    "2026-10-01",
    "original-ugc-beats-ads-that-look-like-ads",
    "Original UGC beats an ad that looks like an ad",
    "Why a person talking about a product in their own room outperforms a polished spot, and what to ask for instead of a script.",
    "creator",
    "A creator profile card, the unit a brand actually hires.",
    [
      "Most Nigerian shoppers can tell a studio ad in the first second. The lighting is even, the voice is borrowed, and the product is held the way a brand guideline says to hold it. They scroll. A creator who already uses the category, speaking the way they speak to a friend, gets the pause because it does not look bought.",
      "That does not mean handing over a blank page. The useful brief names the product truth, the one thing that must be said, and the things that must not be claimed. It leaves the opening line, the room, and the accent alone. A script that reads like a radio spot will be delivered like a radio spot.",
      "On UGCOrigin the person on camera is a verified human, not a stock face and not a generated one. The brand is verified too. The work is a gig with a price, a deadline, and escrow. Original means the creator made it. It also means you can point at who made it.",
    ],
  ),
  post(
    "2026-10-02",
    "what-identity-verification-checks",
    "What identity verification actually checks",
    "A selfie, a NIN, and a person looking at both. What passes, what does not, and why the directory stays quiet until it does.",
    "verify",
    "A check mark on a review card, the outcome of an identity check.",
    [
      "Going live is not a checkbox the creator ticks. They add the bank account payouts should land in, submit a photo of themselves and their NIN, and accept the creator agreement. Someone on the team compares the face in the photo with the person the NIN belongs to.",
      "A profile that has not finished that stays out of the directory. Brands cannot send it an offer, and it cannot apply to a brief or a campaign. That is the point of the gate. A marketplace that lists everyone who signed up is a phone book. A marketplace that lists people who passed a review is a place you can hire from.",
      "If a profile is taken down later, finishing the form again does not put it back. Suspension is a moderation decision. Verification is how you get in. It is not a way around a takedown.",
    ],
  ),
  post(
    "2026-10-03",
    "how-escrow-protects-a-first-hire",
    "How escrow protects a first hire",
    "The brand pays before the work, the creator is not paid before approval, and neither side is trusting a stranger with the whole amount.",
    "escrow",
    "Payment held in a lock before it moves to the creator.",
    [
      "The nervous part of a first hire is the same on both sides. The brand does not want to send money to a handle they just met. The creator does not want to shoot a week of videos for a brand that goes quiet. Escrow is the boring answer. The brand pays. The money sits. The creator delivers. The brand approves. Then the payout is queued.",
      "The platform fee is 12 percent, taken on the way in, so the number the creator accepted is the number they are owed. A refund, when the work is not approved and the rules say so, goes back through Paystack rather than being written down as a note in a spreadsheet.",
      "Nothing is released because someone clicked twice. The transfer happens only when that click itself moves the escrow row out of held. If the row was already released, or was never held, no second payout goes out.",
    ],
  ),
  post(
    "2026-10-04",
    "briefs-versus-direct-offers",
    "Briefs versus a direct offer",
    "Post a brief when you want applicants. Send an offer when you already know the creator. They are not the same job.",
    "brief",
    "A brief document with space to add another creator.",
    [
      "A brief is a public ask. You describe the work, the budget per creator, how many people you need, and a deadline. Live creators apply with a short pitch and, if they have one, a sample. You pick. Picking creates an accepted offer and starts the same escrow path as a direct hire.",
      "A direct offer is for when you have already found the person. You open their card, name the job, name the price, and they have 48 hours. An expired offer cannot be accepted. An offer to a profile that is not live cannot be sent, because that profile is not on the directory.",
      "Use a brief when the niche is wide and you want to see how people talk about the product. Use an offer when the creator's past work is already the reason you are here. Both require a verified brand. An unverified business can set up an account. It cannot publish either.",
    ],
  ),
  post(
    "2026-10-05",
    "per-view-campaigns-without-emptying-the-pool",
    "Per-view campaigns without emptying the pool",
    "A rate per thousand views is only safe if two approvals cannot spend the same remainder.",
    "views",
    "A rising view line that stops when the pool is spent.",
    [
      "A per-view campaign is a pool of naira and a rate per 1,000 approved views. A creator submits the post and a view count. You approve the count you believe. The payout is the rate times the views, and it cannot be more than the money still in the pool.",
      "The dangerous case is two people approving at the same moment, both reading the same remainder. The update only sticks if the pool still holds the figure that was read. The loser of that race does not pay. Inflated counts can be forfeited, and the forfeit is recorded on the submission.",
      "Fund the pool only after the brand is verified. An unfunded campaign is not a place creators can submit to. A funded one from a business nobody checked is not a place we put on the public list.",
    ],
  ),
  post(
    "2026-10-06",
    "why-hidden-profiles-stay-hidden",
    "Why a hidden profile stays hidden",
    "Search, the directory, and the sitemap only carry creators who are live. That is a product rule, not an SEO trick.",
    "creator",
    "A creator card that only exists in public once the profile is live.",
    [
      "The directory query is simple: live, and not shadowbanned. A profile that has not finished bank, identity, and the agreement has is_live set to false. It does not appear in search. It does not appear on a shareable card. It is not in the sitemap crawlers read.",
      "That feels slow when you have just signed up. It is the reason a brand can treat a card as a person. If we indexed every account on day one, the first page of results would be empty bios and the answer engines would quote them.",
      "When you do go live, the card, the handle URL, and the sitemap entry show up together. Growth of the index follows growth of verified people, not growth of signups.",
    ],
  ),
  post(
    "2026-10-07",
    "cac-numbers-and-the-verified-brand-badge",
    "CAC numbers and the verified brand badge",
    "Creators are asked to trust a company name. The badge is how they know a person checked the registration.",
    "verify",
    "A verification mark used for businesses as well as people.",
    [
      "A brand account starts as a company name and a contact. That is enough to look around. It is not enough to post a brief, open a campaign, or send an offer. Those actions wait until the registered name and the CAC/RC number have been reviewed.",
      "The number is not shown to the public. Reviewers see it. Creators see the badge. An unverified brand is also absent from the public brief list and the public campaign list, so a creator is not asked to pitch a business that has not been checked.",
      "If the review comes back short, you resubmit. Pending is not the same as verified. The gate uses the approved state, not the fact that a form was sent.",
    ],
  ),
  post(
    "2026-10-08",
    "what-a-fifteen-second-video-is-worth-in-naira",
    "What a fifteen-second video is worth in naira",
    "Rates move with niche, usage, and how hard the product is to explain. The offer should say the number out loud.",
    "creator",
    "A creator card where the rate sits next to the name.",
    [
      "There is no national price for a fifteen-second video. A skincare routine in Lagos and a hardware demo in Aba are not the same afternoon. What creators can do is publish a starting rate. What brands should do is treat that number as the opening, then write the real price into the offer.",
      "Usage changes the price more than length does. A clip for one organic post is not a clip you will run as a paid ad for six months. Say which one you are buying. Creators price the second one higher because it is doing a media buy's job.",
      "Put the number in the offer, not in a later chat. Escrow is calculated from that number, plus the 12 percent fee. A rate that lives only in WhatsApp is a rate you will argue about when the video is already shot.",
    ],
  ),
  post(
    "2026-10-09",
    "niches-that-convert-for-nigerian-d2c",
    "Niches that convert for Nigerian D2C",
    "Beauty, food, fashion, and gadgets keep showing up because people already film them. The brief still has to be specific.",
    "brief",
    "A brief, the place a niche becomes a concrete ask.",
    [
      "The categories that travel are the ones people already record without being asked. Getting ready, opening a delivery, trying a flavour, showing a fit. A brand in those categories is hiring a habit, not inventing a format.",
      "A niche tag on a profile is a filter, not a promise. Five tags is the cap on a brief so the ask stays readable. 'Lifestyle' alone will attract everyone and fit no one. 'Deodorant for humid commutes' will attract the right three people.",
      "Match the creator's city when the product depends on it. A face cream does not care. A restaurant, a shop opening, or a fabric that has to be touched does. The location on the card is there for that reason.",
    ],
  ),
  post(
    "2026-10-10",
    "shipping-a-product-without-losing-it",
    "Shipping a product without losing it",
    "Say you are sending a physical item before the creator accepts, and agree what happens to it afterwards.",
    "escrow",
    "A held payment beside the practical question of who keeps the product.",
    [
      "An offer can say a physical product is coming. The creator should know that before they accept, because their address and their week change. After booking, the address is shared so a courier can move. It is not on the public card.",
      "Decide, in the brief, whether the product is the creator's to keep, a loan, or something they send back. A ₦4,000 sample and a ₦400,000 device are not the same sentence. Write the sentence.",
      "Escrow covers the fee for the video. It does not track the parcel. If the parcel is the expensive part, use a courier with a receipt and keep that receipt outside the chat. The gig is evidence of the content deal, not of the logistics company.",
    ],
  ),
  post(
    "2026-10-11",
    "on-location-shoots-agree-this-first",
    "On-location shoots: agree this first",
    "A shop, a kitchen, or a street. The address, the hours, and who is allowed to be in frame belong in the offer.",
    "brief",
    "A brief that should name the place before anyone travels.",
    [
      "An on-location job fails in the small print. Who opens the shop. What time the light is usable. Whether customers may be filmed. Whether the creator is paid for the trip if the power is out and you reschedule.",
      "The offer has a place for a location. Use it. A pin in a chat the morning of the shoot is how people miss each other. The creator is travelling on your clock. The price should reflect that, not just the seconds of footage.",
      "If the location is a private home, say so. Creators can decline. Declining is free and does not require them to be live. Accepting does. Do not pressure a hidden profile to show up anyway. They are hidden because they are not hireable yet.",
    ],
  ),
  post(
    "2026-10-12",
    "revision-rounds-that-do-not-stall",
    "Revision rounds that do not stall the gig",
    "One round with notes is a revision. A new concept is a new offer. Write which one you bought.",
    "trust",
    "Two sides of a job that only stays fair if the scope was written down.",
    [
      "Creators expect notes. Change the first line, cover the logo, cut the claim you cannot legally make. That is a revision. Asking for a different product, a different room, and a different argument is another video.",
      "Put the included round in the brief. When the deliverable comes in, the status moves to review. Approving releases escrow. Sending it back for the agreed notes keeps the same gig. Opening a second gig is how you pay for a second idea.",
      "Silence is the stall. A brand that does not review and a creator who does not deliver both hold the money in place. The hold is the safety. It is not a place to leave a job for a month. Review in the window you wrote down.",
    ],
  ),
  post(
    "2026-10-13",
    "human-only-when-ai-ads-are-everywhere",
    "Human-only, when AI ads are everywhere",
    "UGCOrigin is for a person who can be identified. Generated faces and 'not me' bios are flagged, not featured.",
    "verify",
    "The verification mark stands in for a person a reviewer has seen.",
    [
      "Generated video got cheap. It is useful for a storyboard and useless as a testimonial, because a testimonial is a person standing behind a sentence. If the person cannot be found, the sentence is an ad with extra steps.",
      "Profiles that say the content is AI, or that the face is not the creator, get flagged. The directory is built from people who passed a photo and NIN review. A generated clip can still be made. It will not be hired here as if it were a creator.",
      "Brands should say this in the brief in one line: we are buying your face and your voice, filmed by you. Creators who do not want that job can skip it. The ones who take it are the ones the badge describes.",
    ],
  ),
  post(
    "2026-10-14",
    "reading-a-creator-tier-without-gaming-it",
    "Reading a creator tier without gaming it",
    "Tiers move with finished work and with reviews the brand wrote, not with reviews the creator wrote about the brand.",
    "creator",
    "A creator card carrying a tier next to completed work.",
    [
      "A tier is a summary of finished gigs, ratings, and reliability. It is not a badge you buy with a boost, and it is not a number you type in. Boosting a card makes it easier to see. It does not change the tier.",
      "The rating that counts is the brand's review of the creator. A creator's review of the brand is about the brand. Mixing those two made early scores look busy and mean nothing. The score now follows the direction of the hire.",
      "Read the tier beside the completed-gig count, not instead of it. A high tier with no finished work on the platform is a new account. A lower tier with a stack of completed, paid jobs is someone who has already done the thing you are about to pay for.",
    ],
  ),
  post(
    "2026-10-15",
    "payout-timing-and-the-bank-check",
    "Payout timing and the bank check",
    "The bank account is part of going live because a finished gig has to have somewhere to land.",
    "escrow",
    "The lock opens toward a bank account that was checked before the profile went live.",
    [
      "Creators add a bank account before they go live. The account name is resolved against the bank so the payout is not a guess. That check is why 'I'll add my bank after the first job' is not an option. The first job is already too late to discover the account is wrong.",
      "Release queues a payout. It does not promise the same minute. Paystack moves the transfer, and a failed transfer can be retried with a new reference so the provider does not treat the retry as a duplicate of the failure.",
      "The account number is not on the public profile. Brands do not need it. The platform does, and only after the creator has been hired and the work approved. Public cards show the work. They do not show the bank.",
    ],
  ),
  post(
    "2026-10-16",
    "how-to-write-a-brief-creators-can-answer",
    "How to write a brief creators can answer",
    "Product, claim, format, don'ts, price, deadline. If one of those is missing, the pitches will invent it.",
    "brief",
    "A brief with the lines a creator needs before they pitch.",
    [
      "A pitchable brief fits on a screen. What the product is. The one claim you are allowed to make. The format, vertical and about fifteen to thirty seconds unless you truly need longer. What they must not say. The budget. The date.",
      "Links to a drive of logos help. A twelve-page brand book attached as the brief does not. Creators price the reading. If the reading is the job, pay for a longer job.",
      "Open the brief only when the brand is verified. Applicants are live creators. You will see pitches from people who can be hired, not from accounts that still owe a NIN. That keeps the inbox shorter and the replies honest.",
    ],
  ),
  post(
    "2026-10-17",
    "sample-videos-worth-featuring",
    "Sample videos that are worth featuring",
    "A sample on an application is a clue. A verified work on a profile is a gig this marketplace already paid for.",
    "creator",
    "A profile that can carry work finished on the platform.",
    [
      "When a creator applies, the sample link is optional and unverified. It shows taste. It does not show that anyone was paid. Treat it as a portfolio clip from somewhere else.",
      "A clip marked verified was tied to a completed gig. The creator owns the profile, the gig was theirs, and the file lives in their folder. That is a stronger sentence than 'here is a link'. Use those when you are choosing between two pitches that sound the same.",
      "Do not ask applicants to pad the sample with work they did not make. The human-only rule applies to samples too. A borrowed viral video is not a sample. It is a reason to decline.",
    ],
  ),
  post(
    "2026-10-18",
    "disputes-release-refund-or-split",
    "Disputes: release, refund, or split",
    "A dispute names an amount. The money moves only after the held escrow actually changes hands, including the refund.",
    "escrow",
    "A dispute is still the same locked payment, pointed at a decision.",
    [
      "Most gigs never become disputes. When one does, the outcomes are release to the creator, refund to the brand, or a split of the creator's rate. The platform fee is not quietly given to either side as if it were part of the rate.",
      "Large amounts are not settled by one admin. At or above the dual-control threshold the action stops and points at the finance console, where a second person has to agree. Below that line, the settlement still refuses to pay unless it successfully moved the escrow out of held.",
      "A refund that Paystack does not accept does not get marked refunded. The row goes back to held. That is slower than a green check. It is also the only version that matches the bank.",
    ],
  ),
  post(
    "2026-10-19",
    "do-not-apply-before-you-are-live",
    "Do not apply before you are live",
    "The apply button closes itself until verification is finished. That saves the pitch you would have written for a brand that cannot hire you.",
    "verify",
    "Verification comes before the application, not after.",
    [
      "An account with a half-finished creator profile can sign in and look at briefs. It cannot apply. The same is true of campaign submissions and of accepting an offer. Decline is still available. Accepting is the moment you become the person being paid, so it waits.",
      "The reason is practical. A brand reviewing twenty pitches should not spend four of them on people who still owe a photo of themselves. Those pitches feel like leads. They are not leads. They are unfinished setups.",
      "Finish bank, identity, and the agreement. When the review passes, the card goes live, the sitemap can carry the handle, and the apply button starts working. The pitches you send after that are the ones worth writing.",
    ],
  ),
  post(
    "2026-10-20",
    "lagos-abuja-and-the-location-on-the-card",
    "Lagos, Abuja, and the location on the card",
    "Location is a hiring filter for work that happens in a place. It is not a ranking boost for work that happens in a bedroom.",
    "creator",
    "A creator card with a city, used when the job is physical.",
    [
      "A talking-head video can be filmed anywhere with light and a quiet corner. A store visit cannot. The city on the card is how a brand in Abuja avoids hiring a creator who would need a flight, and how a creator in Port Harcourt avoids a brief that assumes same-day pickup in Ikeja.",
      "Write the city you can actually reach this month. A location you visit twice a year will produce a missed shoot and a dispute. The directory filter is only as honest as the field.",
      "Remote work should say remote in the brief. Do not leave location blank and hope. Creators read a blank as 'anywhere', then discover the booking is a shop in another state.",
    ],
  ),
  post(
    "2026-10-21",
    "usage-rights-brands-should-name",
    "Usage rights brands should name up front",
    "Organic post, paid ads, whitelisting, and how long. The price is a price for a use, not for a file.",
    "trust",
    "The agreement between brand and creator includes what the file may do after delivery.",
    [
      "Creators are not confused about usage. They are wary of brands who call a paid-media buy 'just a TikTok'. If you will run the clip as an ad, say so, name the rough duration, and expect the rate to move.",
      "Whitelisting, where the ad runs from the creator's handle, is a separate yes. It uses their account, not only their face. It is not included because you paid for a file.",
      "Put the sentence in the brief and again in the offer. Chat messages get lost. The gig is the record. When a dispute happens, the record is what gets read, not the memory of a call.",
    ],
  ),
  post(
    "2026-10-22",
    "what-a-verified-work-proves",
    "What a verified work on a profile proves",
    "It proves a completed gig, a real creator, and a file in that creator's folder. It does not prove the views it got later.",
    "creator",
    "Verified work sits on the creator card as finished marketplace work.",
    [
      "After a gig is completed, the creator can feature a cut of it. The upload has to live in their own folder, and the verified flag is written by the server after it checks the gig. They cannot stamp verified on a video from their camera roll.",
      "What you can conclude: this person finished paid work on UGCOrigin, and this is the clip they want you to judge. What you cannot conclude: the view count they mention in the caption, or that the brand will hire them again.",
      "Use it as a work sample with a paper trail. Then still read the brief fit. A brilliant food video is not a brief for a bank.",
    ],
  ),
  post(
    "2026-10-23",
    "build-a-roster-instead-of-one-off-hires",
    "Build a roster instead of one-off hires",
    "The second job with a creator you already trust is cheaper than the search that found them.",
    "trust",
    "Repeat work is the relationship the first verified hire makes possible.",
    [
      "A first hire is a search. A second hire is a message. Brands that win at UGC keep a short list of creators who already understand the product and already have a payout path that worked.",
      "Save creators while you browse, but only hire the live ones. A saved name is a note. An offer is a contract. The offer still goes through escrow even when you have worked together before. Familiarity is not a reason to pay off-platform. Off-platform is where the dispute has no record.",
      "Creators should treat a finished gig as the start of a roster too. Feature the verified cut. Answer the next brief from that brand faster because you already know the don'ts. Speed, after trust exists, is the advantage.",
    ],
  ),
  post(
    "2026-10-24",
    "campaign-math-rate-per-thousand",
    "Campaign math: the rate per thousand",
    "Pool divided by rate, times a thousand, is the most views you can buy. Partial thousands still pay a fraction.",
    "views",
    "The chart of views is denominated in the pool you funded.",
    [
      "If the pool is ₦100,000 and the rate is ₦4,000 per 1,000 views, you can buy 25,000 views before the pool is empty. A submission with 2,500 approved views is owed ₦10,000, if the pool still has it. A submission with 100 views is owed ₦400, not zero. The rate is a rate, not a minimum of a thousand.",
      "When the pool is empty, further approvals pay nothing. That is announced as an error, not as a silent ₦0 success. Creators should not hear that they were paid when the pool was already gone.",
      "Set the rate from the value of a view in your category, not from a round number that looks tidy. A tidy rate that overpays will empty the pool on the first post. A tidy rate that underpays will get no submissions worth approving.",
    ],
  ),
  post(
    "2026-10-25",
    "trust-signals-both-sides-can-read",
    "Trust signals both sides can read",
    "Badge, tier, completed gigs, escrow, and a brief that names the usage. Each one answers a different fear.",
    "trust",
    "Brand and creator only meet in public after the checks that make the badges mean something.",
    [
      "Creators look for the verified brand badge because a company name is cheap to type. Brands look for a live creator, a tier that came from finished work, and at least one verified clip. Neither signal replaces the brief. Together they remove the obvious frauds.",
      "Escrow answers the payment fear. The badge answers the identity fear. The usage line answers the 'what will you do with my face' fear. If a page on the platform is missing one of those, it is not done.",
      "We do not invent extra badges for appearance. A badge that does not check anything trains people to ignore badges. The ones here are tied to a review, a completed gig, or money that actually moved.",
    ],
  ),
  post(
    "2026-10-26",
    "the-marketplace-grows-when-verified-people-do",
    "The marketplace grows when verified people do",
    "The public index is live creators, verified brands' open work, and this journal. Signups do not inflate it.",
    "creator",
    "The public surface of the marketplace is the set of people and posts that passed the gates.",
    [
      "A bigger user table is not a bigger marketplace. The pages crawlers should read are the ones a buyer or a creator can act on: a live creator card, an open brief from a verified brand, a funded campaign from a verified brand, and a journal piece with a date.",
      "That list gets longer only when someone passes verification or when a new journal piece is published. An unverified account does not earn a URL in the sitemap. An unverified brand does not earn a public brief. The index stays the same shape as the product.",
      "If you are publishing for answer engines, quote the pieces that name a date and a rule. The rules above are the product. The journal is the explanation. Both should move when the product moves, and neither should pretend a hidden profile is a public creator.",
    ],
  ),
].sort((a, b) => a.date.localeCompare(b.date));

export function journalPost(slug: string): JournalPost | undefined {
  return JOURNAL.find((p) => p.slug === slug);
}
